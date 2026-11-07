/**
 * Validates payload and provides exception handling for Socket.IO event listeners.
 * Prevents server crashes from malformed, undefined, or unexpected client payloads.
 */

export function onPayload(socket, event, schema, fn) {
  let actualSchema = schema;
  let actualFn = fn;

  // Signature overload: onPayload(socket, event, fn)
  if (typeof schema === 'function' && fn === undefined) {
    actualFn = schema;
    actualSchema = null;
  }

  socket.on(event, (rawPayload, rawAck) => {
    // 1. Normalize payload & acknowledgment callback
    let payload = rawPayload;
    let ack = rawAck;

    if (typeof rawPayload === 'function') {
      ack = rawPayload;
      payload = {};
    } else if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      payload = {};
    }

    const safeAck = typeof ack === 'function' ? ack : () => {};

    const respondError = (errorMsg) => {
      console.warn(`[Socket Warn] Event '${event}' from socket ${socket.id}: ${errorMsg}`);
      safeAck({ success: false, error: errorMsg, message: errorMsg });
    };

    try {
      // 2. Validate types against schema if provided
      if (actualSchema) {
        for (const [key, rules] of Object.entries(actualSchema)) {
          const rule = typeof rules === 'string' ? { type: rules, required: true } : rules;
          const val = payload[key];

          if (rule.required && (val === undefined || val === null || val === '')) {
            respondError(`Missing required field: '${key}'`);
            return;
          }

          if (val !== undefined && val !== null) {
            if (rule.type === 'number') {
              if (typeof val !== 'number' || !Number.isFinite(val)) {
                respondError(`Invalid type for '${key}': expected number, got ${typeof val}`);
                return;
              }
            } else if (rule.type === 'string') {
              if (typeof val !== 'string') {
                respondError(`Invalid type for '${key}': expected string, got ${typeof val}`);
                return;
              }
            } else if (rule.type === 'boolean') {
              if (typeof val !== 'boolean') {
                respondError(`Invalid type for '${key}': expected boolean, got ${typeof val}`);
                return;
              }
            }
          }
        }
      }

      // 3. Execute handler safely inside try/catch
      const result = actualFn(payload, safeAck);

      // Handle async handlers if returned
      if (result && typeof result.catch === 'function') {
        result.catch((err) => {
          console.error(`[Socket Error] Async error in handler for event '${event}':`, err);
          respondError(err.message || 'Internal server error');
        });
      }
    } catch (err) {
      console.error(`[Socket Error] Exception in handler for event '${event}':`, err);
      respondError(err.message || 'Internal server error');
    }
  });
}

export const safeHandler = onPayload;
