import {
  clone,
  copy,
  defineConfig,
  isValidObject,
  isValidUrl,
} from '@agile-ts/core';

export default class API {
  public config: ApiConfig;

  /**
   * @public
   * @param config - Config
   */
  constructor(config: ApiConfig = {}) {
    this.config = config;
  }

  //=========================================================================================================
  // With
  //=========================================================================================================
  /**
   * Overrides API Config and returns overwritten API Instance
   * Note: Doesn't overwrite this API Class
   * @param config - Config
   */
  public with(config: ApiConfig = {}): API {
    const modifiedApi = clone(this);
    modifiedApi.config = { ...this.config, ...config };
    return modifiedApi;
  }

  //=========================================================================================================
  // Get
  //=========================================================================================================
  /**
   * @public
   *  Get Request
   *  @param path - Url Path
   *  @param config - Config
   */
  public get(path: string, config: RequestInit = {}) {
    return this.send('GET', path, config);
  }

  //=========================================================================================================
  // Post
  //=========================================================================================================
  /**
   * @public
   *  Post Request
   *  @param path - Url Path
   *  @param payload - Payload of Post Request
   *  @param config - Config
   */
  public post(path: string, payload?: any, config: RequestInit = {}) {
    return this.send('POST', path, payload, config);
  }

  //=========================================================================================================
  // Put
  //=========================================================================================================
  /**
   * @public
   *  Put Request
   *  @param path - Url Path
   *  @param payload - Payload of Put Request
   *  @param config - Config
   */
  public put(path: string, payload?: any, config: RequestInit = {}) {
    return this.send('PUT', path, payload, config);
  }

  //=========================================================================================================
  // Patch
  //=========================================================================================================
  /**
   * @public
   *  Patch Request
   *  @param path - Url Path
   *  @param payload - Payload of Patch Request
   *  @param config - Config
   */
  public patch(path: string, payload?: any, config: RequestInit = {}) {
    return this.send('PATCH', path, payload, config);
  }

  //=========================================================================================================
  // Delete
  //=========================================================================================================
  /**
   * @public
   *  Delete Request
   *  @param path - Url Path
   *  @param payload - Payload of Delete Request
   *  @param config - Config
   */
  public delete(path: string, payload?: any, config: RequestInit = {}) {
    return this.send('DELETE', path, payload, config);
  }

  //=========================================================================================================
  // Send
  //=========================================================================================================
  /**
   * @internal
   * Handles Requests
   */
  private async send(
    method: string,
    endpoint: string,
    payload?: any,
    options: RequestInit = {}
  ): Promise<AgileResponse> {
    let fullUrl: string;
    let response: Response | undefined;
    let timedout = false;

    // Configure request Options
    const config = copy(this.config);
    config.options = defineConfig(options, config.options || {});
    config.options.method = method;
    if (!config.options.headers) config.options.headers = {};

    // Set request Body
    if (isValidObject(payload)) {
      config.options.body = JSON.stringify(payload);
      config.options.headers['content-type'] = 'application/json';
    } else {
      config.options.body = payload;
    }

    // Build Url
    if (endpoint.startsWith('http')) fullUrl = endpoint;
    else
      fullUrl = `${this.config.baseURL ?? ''}${
        this.config.path ? '/' + this.config.path : ''
      }/${endpoint}`;

    // Warning if fullUrl might be invalid
    if (!isValidUrl(fullUrl))
      console.warn(`Url '${fullUrl}' might be invalid!`);

    // Send Request with Timeout
    if (this.config.timeout) {
      let timeout: any;

      // Create Timeout Promise
      const timeoutPromise = new Promise((resolve) => {
        timeout = setTimeout(() => {
          timedout = true;
          resolve(undefined);
        }, this.config.timeout);
      });

      // Send Request Promise
      const request = new Promise((resolve, reject) => {
        fetch(fullUrl, this.config.options)
          .then((data) => {
            clearTimeout(timeout);
            resolve(data);
          })
          .catch(reject);
      });

      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race
      response = (await Promise.race([timeoutPromise, request])) as any;
    }

    // Send Request without Timeout
    if (!this.config.timeout)
      response = await fetch(fullUrl, this.config.options);

    // Create Agile Response
    const agileResponse: AgileResponse = {
      status: timedout ? 408 : response?.status || 404,
      raw: response,
      data: {},
      type: response?.headers?.get('content-type'),
      timedout: timedout,
    };

    // Extract Response Data
    if (agileResponse.type?.includes('application/json'))
      agileResponse.data = await agileResponse.raw?.json();

    return agileResponse;
  }
}

/**
 * @param data - Request Body Data
 * @param timedout - If Request timed out
 * @param status - Response Status Code
 * @param raw - Raw Response
 * @param type - Response Type for instance 'application/json'
 */
export interface AgileResponse<DataType = any> {
  data: DataType;
  timedout?: boolean;
  status: number;
  raw?: Response;
  type?: string | null;
}

/**
 * @param options - Request Options
 * @param baseURL - Base Url of the Endpoint (eg 'https://api.mysite.co')
 * @param path - Path to the Endpoint (eg '/v1')
 * @param timeout - Timeout if Endpoint didn't Response
 */
export interface ApiConfig {
  options?: RequestInit;
  baseURL?: string;
  path?: string;
  timeout?: number;
}
