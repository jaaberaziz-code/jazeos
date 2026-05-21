<?php

namespace App\Services;

use App\Models\GmailConnection;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Gmail API Service for receipt processing.
 * 
 * Requires google/apiclient package: composer require google/apiclient
 * Falls back gracefully when package is not installed.
 */
class GmailService
{
    protected $client;

    protected $gmail;

    public function __construct()
    {
        if (!$this->isGoogleApiAvailable()) {
            throw new \RuntimeException(
                'Google API client is not installed. Run: composer require google/apiclient'
            );
        }
        $this->initializeClient();
    }

    public static function isGoogleApiAvailable(): bool
    {
        return class_exists('Google\Client');
    }

    protected function initializeClient(): void
    {
        $this->client = new \Google\Client;
        $this->client->setApplicationName(config('app.name'));
        $this->client->setClientId(config('gmail_receipts.client_id'));
        $this->client->setClientSecret(config('gmail_receipts.client_secret'));

        $redirectUri = config('gmail_receipts.redirect_uri')
            ?: config('app.url').'/settings/gmail-receipts/callback';
        $this->client->setRedirectUri($redirectUri);

        $this->client->setScopes(config('gmail_receipts.scopes'));
        $this->client->setAccessType('offline');
        $this->client->setPrompt('consent');
    }

    protected function validateCredentials(): void
    {
        $clientId = config('gmail_receipts.client_id');
        $clientSecret = config('gmail_receipts.client_secret');

        if (! $clientId || ! $clientSecret) {
            throw new \RuntimeException(
                'Gmail API credentials are not configured. '.
                'Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in your .env file.'
            );
        }
    }

    public function getAuthUrl(?string $state = null): string
    {
        $this->validateCredentials();
        if ($state) {
            $this->client->setState($state);
        }
        return $this->client->createAuthUrl();
    }

    public function authenticate(User $user, string $authCode): GmailConnection
    {
        $this->validateCredentials();

        try {
            $token = $this->client->fetchAccessTokenWithAuthCode($authCode);

            if (isset($token['error'])) {
                throw new Exception('Error fetching access token: '.$token['error']);
            }

            $this->client->setAccessToken($token);
            $oauth = new \Google\Service\Oauth2($this->client);
            $userInfo = $oauth->userinfo->get();

            $expiresAt = isset($token['expires_in'])
                ? Carbon::now()->addSeconds($token['expires_in'])
                : null;

            $connection = GmailConnection::where('user_id', $user->id)
                ->where('email_address', $userInfo->email)
                ->first();

            $data = [
                'access_token' => $token['access_token'],
                'token_expires_at' => $expiresAt,
                'sync_enabled' => true,
            ];

            if (isset($token['refresh_token'])) {
                $data['refresh_token'] = $token['refresh_token'];
            }

            if ($connection) {
                $connection->update($data);
            } else {
                if (! isset($token['refresh_token'])) {
                    throw new Exception('Refresh token is required for new Gmail connections');
                }

                $data['user_id'] = $user->id;
                $data['email_address'] = $userInfo->email;
                $data['refresh_token'] = $token['refresh_token'];
                $connection = GmailConnection::create($data);
            }

            return $connection;
        } catch (Exception $e) {
            Log::error('Gmail authentication failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function refreshToken(GmailConnection $connection): GmailConnection
    {
        try {
            $this->client->setAccessToken([
                'access_token' => $connection->access_token,
                'refresh_token' => $connection->refresh_token,
            ]);

            if ($this->client->isAccessTokenExpired()) {
                $token = $this->client->fetchAccessTokenWithRefreshToken($connection->refresh_token);

                if (isset($token['error'])) {
                    throw new Exception('Error refreshing token: '.$token['error']);
                }

                $expiresAt = isset($token['expires_in'])
                    ? Carbon::now()->addSeconds($token['expires_in'])
                    : null;

                $connection->update([
                    'access_token' => $token['access_token'],
                    'refresh_token' => $token['refresh_token'] ?? $connection->refresh_token,
                    'token_expires_at' => $expiresAt,
                ]);
            }

            return $connection->fresh();
        } catch (Exception $e) {
            Log::error('Gmail token refresh failed', [
                'connection_id' => $connection->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    protected function setConnection(GmailConnection $connection): void
    {
        if ($connection->isTokenExpired()) {
            $this->refreshToken($connection);
            $connection->refresh();
        }

        $this->client->setAccessToken([
            'access_token' => $connection->access_token,
            'refresh_token' => $connection->refresh_token,
        ]);

        $this->gmail = new \Google\Service\Gmail($this->client);
    }

    public function fetchReceiptEmails(GmailConnection $connection, ?Carbon $since = null, int $maxResults = 100): array
    {
        try {
            $this->setConnection($connection);

            $queries = config('gmail_receipts.search_queries');
            $query = implode(' OR ', array_map(fn ($q) => "({$q})", $queries));

            if ($since) {
                $query .= ' after:'.$since->format('Y/m/d');
            }

            $messages = [];
            $pageToken = null;

            do {
                $params = [
                    'maxResults' => min($maxResults - count($messages), 100),
                    'q' => $query,
                ];

                if ($pageToken) {
                    $params['pageToken'] = $pageToken;
                }

                $response = $this->gmail->users_messages->listUsersMessages('me', $params);

                foreach ($response->getMessages() as $message) {
                    $messages[] = $this->getMessageDetails($message->getId());

                    if (count($messages) < $maxResults) {
                        usleep(100000);
                    }

                    if (count($messages) >= $maxResults) {
                        break 2;
                    }
                }

                $pageToken = $response->getNextPageToken();
            } while ($pageToken && count($messages) < $maxResults);

            return $messages;
        } catch (Exception $e) {
            Log::error('Failed to fetch Gmail receipts', [
                'connection_id' => $connection->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function getMessageDetails(string $messageId): array
    {
        try {
            $message = $this->gmail->users_messages->get('me', $messageId, ['format' => 'full']);

            return [
                'id' => $message->getId(),
                'thread_id' => $message->getThreadId(),
                'subject' => $this->getHeader($message, 'Subject'),
                'from' => $this->getHeader($message, 'From'),
                'to' => $this->getHeader($message, 'To'),
                'date' => $this->getHeader($message, 'Date'),
                'snippet' => $message->getSnippet(),
                'body' => $this->getMessageBody($message),
                'attachments' => $this->getAttachments($message),
                'labels' => $message->getLabelIds() ?? [],
            ];
        } catch (Exception $e) {
            Log::error('Failed to get message details', [
                'message_id' => $messageId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    protected function getHeader($message, string $name): ?string
    {
        $headers = $message->getPayload()->getHeaders();

        foreach ($headers as $header) {
            if (strtolower($header->getName()) === strtolower($name)) {
                return $header->getValue();
            }
        }

        return null;
    }

    protected function getMessageBody($message): string
    {
        $payload = $message->getPayload();
        $body = '';

        if ($payload->getParts()) {
            foreach ($payload->getParts() as $part) {
                if ($part->getMimeType() === 'text/html') {
                    $body = base64_decode(strtr($part->getBody()->getData(), '-_', '+/'));
                    break;
                } elseif ($part->getMimeType() === 'text/plain' && empty($body)) {
                    $body = base64_decode(strtr($part->getBody()->getData(), '-_', '+/'));
                }

                if ($part->getParts()) {
                    foreach ($part->getParts() as $subPart) {
                        if ($subPart->getMimeType() === 'text/html') {
                            $body = base64_decode(strtr($subPart->getBody()->getData(), '-_', '+/'));
                            break 2;
                        } elseif ($subPart->getMimeType() === 'text/plain' && empty($body)) {
                            $body = base64_decode(strtr($subPart->getBody()->getData(), '-_', '+/'));
                        }
                    }
                }
            }
        } elseif ($payload->getBody()->getData()) {
            $body = base64_decode(strtr($payload->getBody()->getData(), '-_', '+/'));
        }

        return strip_tags($body);
    }

    protected function getAttachments($message): array
    {
        $attachments = [];
        $payload = $message->getPayload();
        $allowedExtensions = config('gmail_receipts.attachment_extensions', []);

        $this->extractAttachmentsFromParts($payload, $attachments, $allowedExtensions);

        return $attachments;
    }

    protected function extractAttachmentsFromParts($part, array &$attachments, array $allowedExtensions): void
    {
        if ($part->getFilename() && $part->getBody()->getAttachmentId()) {
            $extension = strtolower(pathinfo($part->getFilename(), PATHINFO_EXTENSION));

            if (in_array($extension, $allowedExtensions)) {
                $attachments[] = [
                    'filename' => $part->getFilename(),
                    'attachment_id' => $part->getBody()->getAttachmentId(),
                    'mime_type' => $part->getMimeType(),
                    'size' => $part->getBody()->getSize(),
                ];
            }
        }

        if ($part->getParts()) {
            foreach ($part->getParts() as $subPart) {
                $this->extractAttachmentsFromParts($subPart, $attachments, $allowedExtensions);
            }
        }
    }

    public function downloadAttachment(GmailConnection $connection, string $messageId, string $attachmentId, string $filename): ?string
    {
        try {
            $this->setConnection($connection);

            $attachment = $this->gmail->users_messages_attachments->get('me', $messageId, $attachmentId);
            $data = base64_decode(strtr($attachment->getData(), '-_', '+/'));

            $userId = $connection->user_id;
            $year = Carbon::now()->year;
            $month = Carbon::now()->format('m');
            $path = config('gmail_receipts.storage_path')."/{$userId}/{$year}/{$month}/";

            $sanitizedFilename = basename($filename);
            $sanitizedFilename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $sanitizedFilename);
            $sanitizedFilename = substr($sanitizedFilename, 0, 255);

            $extension = pathinfo($sanitizedFilename, PATHINFO_EXTENSION);
            $basename = pathinfo($sanitizedFilename, PATHINFO_FILENAME);

            if (empty($basename)) {
                $basename = 'receipt_'.bin2hex(random_bytes(8));
            }

            $uniqueFilename = $basename.'_'.time();
            if (! empty($extension)) {
                $uniqueFilename .= '.'.$extension;
            }

            $fullPath = $path.$uniqueFilename;
            Storage::put($fullPath, $data);

            return $fullPath;
        } catch (Exception $e) {
            Log::error('Failed to download attachment', [
                'connection_id' => $connection->id,
                'message_id' => $messageId,
                'attachment_id' => $attachmentId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function addLabel(GmailConnection $connection, string $messageId, string $labelName): bool
    {
        try {
            $this->setConnection($connection);

            $labelId = $this->getOrCreateLabel($labelName);

            $mods = new \Google\Service\Gmail\ModifyMessageRequest;
            $mods->setAddLabelIds([$labelId]);

            $this->gmail->users_messages->modify('me', $messageId, $mods);

            return true;
        } catch (Exception $e) {
            Log::error('Failed to add label to message', [
                'connection_id' => $connection->id,
                'message_id' => $messageId,
                'label' => $labelName,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    protected function getOrCreateLabel(string $labelName): string
    {
        try {
            $labels = $this->gmail->users_labels->listUsersLabels('me');

            foreach ($labels->getLabels() as $label) {
                if ($label->getName() === $labelName) {
                    return $label->getId();
                }
            }

            $label = new \Google\Service\Gmail\Label;
            $label->setName($labelName);
            $label->setLabelListVisibility('labelShow');
            $label->setMessageListVisibility('show');

            $createdLabel = $this->gmail->users_labels->create('me', $label);

            return $createdLabel->getId();
        } catch (Exception $e) {
            Log::error('Failed to get or create label', [
                'label' => $labelName,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
