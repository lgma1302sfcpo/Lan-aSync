import { NativeModules, Platform } from 'react-native';

const API_PORT = 3333;

function getMetroHost() {
  const scriptURL = NativeModules.SourceCode?.scriptURL as string | undefined;
  const match = scriptURL?.match(/^https?:\/\/([^:/]+)/);
  return match?.[1];
}

const metroHost = getMetroHost();

const apiHosts = [
  metroHost && !['localhost', '127.0.0.1'].includes(metroHost) ? metroHost : null,
  'localhost',
  Platform.OS === 'android' ? '10.0.2.2' : null,
].filter((host): host is string => Boolean(host));

export const API_URLS = Array.from(new Set(apiHosts)).map(
  host => `http://${host}:${API_PORT}/api`,
);

export const API_URL = API_URLS[0];
