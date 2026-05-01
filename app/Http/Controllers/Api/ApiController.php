<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

abstract class ApiController extends Controller
{

        protected function ok(string $message = 'Success', mixed $data = null): JsonResponse
    {
        return $this->success($message, $data, 200);
    }

        protected function created(string $message = 'Created', mixed $data = null): JsonResponse
    {
        return $this->success($message, $data, 201);
    }

        protected function success(string $message, mixed $data, int $status): JsonResponse
    {
        $body = [
            'success' => true,
            'message' => $message,
        ];

        if (! is_null($data)) {
            $body['data'] = $data;
        }

        return response()->json($body, $status);
    }

        protected function badRequest(string $message = 'Bad Request', array $errors = []): JsonResponse
    {
        return $this->error($message, 400, $errors);
    }

        protected function unauthorized(string $message = 'Unauthorised'): JsonResponse
    {
        return $this->error($message, 401);
    }

        protected function forbidden(string $message = 'Forbidden'): JsonResponse
    {
        return $this->error($message, 403);
    }

        protected function notFound(string $message = 'Not found'): JsonResponse
    {
        return $this->error($message, 404);
    }

        protected function unprocessable(string $message = 'Validation failed', array $errors = []): JsonResponse
    {
        return $this->error($message, 422, $errors);
    }

        protected function error(string $message, int $status, array $errors = []): JsonResponse
    {
        $body = [
            'success' => false,
            'message' => $message,
        ];

        if (! empty($errors)) {
            $body['errors'] = $errors;
        }

        return response()->json($body, $status);
    }
}
