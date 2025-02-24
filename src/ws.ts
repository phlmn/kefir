import ReconnectingWebSocket from 'reconnecting-websocket';

const timeout = 10000;
const ws = new ReconnectingWebSocket('ws://dsp.local:1234', [], {
  connectionTimeout: timeout,
});
const response_handlers: Record<string, (message: { data: string }) => void> =
  {};
ws.onmessage = (message: any) => {
  console.info(message);
  Object.values(response_handlers)[0](message);
};

ws.onopen = console.info;

export function send(to_send: string | Record<string, any>): Promise<any> {
  const id = Date.now().toString();
  const promise = new Promise((resolve, reject) => {
    const timeout_handler = setTimeout(() => {
      delete response_handlers[id];
      reject('timeout');
    }, timeout);

    const handler = (message: { data: string }) => {
      clearTimeout(timeout_handler);
      delete response_handlers[id];

      let response;
      if (typeof to_send == 'string') {
        response = JSON.parse(message.data)[to_send];
      } else {
        response = JSON.parse(message.data)[Object.keys(to_send)[0]];
      }
      if (response && response.result == 'Ok') {
        resolve(response.value);
      } else {
        reject(message.data);
      }
    };
    response_handlers[id] = handler;
  });
  ws.send(JSON.stringify(to_send));
  return promise;
}

window.send = send;

declare global {
  interface Window {
    send: typeof send;
  }
}
