// This shim ensures `createMiddleware` from @tanstack/start-client-core
// resolves correctly in the Nitro/Vercel server bundle instead of being
// replaced with a client-side stub.

var createMiddleware = (options, __opts) => {
  const resolvedOptions = {
    type: "request",
    ...(__opts || options),
  };
  const setValidator = (validator) => {
    return createMiddleware(
      {},
      Object.assign(resolvedOptions, { validator, inputValidator: validator }),
    );
  };
  return {
    options: resolvedOptions,
    middleware: (middleware) => {
      return createMiddleware({}, Object.assign(resolvedOptions, { middleware }));
    },
    validator: setValidator,
    inputValidator: setValidator,
    client: (client) => {
      return createMiddleware({}, Object.assign(resolvedOptions, { client }));
    },
    server: (server) => {
      return createMiddleware({}, Object.assign(resolvedOptions, { server }));
    },
  };
};

export { createMiddleware };
