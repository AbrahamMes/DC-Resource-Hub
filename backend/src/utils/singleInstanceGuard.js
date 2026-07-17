const positiveInteger = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

/**
 * SQLite and local uploads require one backend process. This catches common
 * process-manager configurations before the HTTP server accepts traffic.
 * Separate hosts must still be constrained by the hosting configuration.
 */
export function assertSingleInstanceEnvironment(env = process.env) {
  const errors = [];

  if (positiveInteger(env.WEB_CONCURRENCY) && Number(env.WEB_CONCURRENCY) !== 1) {
    errors.push(`WEB_CONCURRENCY must be 1 (received ${env.WEB_CONCURRENCY})`);
  }

  if (env.PM2_INSTANCES && env.PM2_INSTANCES !== '1') {
    errors.push(`PM2_INSTANCES must be 1 (received ${env.PM2_INSTANCES})`);
  }

  // NODE_APP_INSTANCE is assigned by PM2 to every clustered process. Only
  // instance zero is allowed to start, which prevents concurrent DB writers.
  if (env.NODE_APP_INSTANCE && env.NODE_APP_INSTANCE !== '0') {
    errors.push(`PM2 cluster instance ${env.NODE_APP_INSTANCE} cannot use local SQLite storage`);
  }

  // Node's cluster workers receive NODE_UNIQUE_ID. This app must be launched
  // directly with `node`, not through cluster.fork().
  if (env.NODE_UNIQUE_ID) {
    errors.push('Node cluster workers cannot use local SQLite storage');
  }

  if (errors.length > 0) {
    throw new Error(`Unsafe multi-instance configuration: ${errors.join('; ')}`);
  }
}

export default assertSingleInstanceEnvironment;
