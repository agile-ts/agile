import * as http from "http";
import { copy, isValidUrl } from "@agile-ts/core";

//=========================================================================================================
// API
//=========================================================================================================
/**
 * Create Agile API
 * @param config Object
 * @param config.options Object - Typescript default: RequestInit (headers, credentials, mode, etc...)
 * @param config.baseURL String - Url to prepend to endpoints (without trailing slash)
 * @param config.timeout Number - Time to wait for request before throwing error
 */
// public API = (config: apiConfig) => new API(config);

export interface AgileResponse<DataType = any> {
  data: DataType; // request body data
  timedout?: boolean; // if request get timedout
  status: number; // request status code
  raw?: Response; // the raw response
  type?: string | null; // response type (for instance 'application/json')
}

export interface apiConfig {
  options: RequestInit; // Request Options
  baseURL?: string; // baseURL (https://api.mysite.co)
  path?: string; // path (api) -> combined with baseUrl the url is https://api.mysite.co/api/...
  timeout?: number; // when the request should timeout
}

export default class API {
  public config: apiConfig;

  constructor(config: apiConfig = { options: {} }) {
    this.config = config;
  }

  //=========================================================================================================
  // Get
  //=========================================================================================================
  /**
   *  Get request
   */
  public get(endpoint: string, options?: RequestInit) {
    return this.send("GET", endpoint, options);
  }

  //=========================================================================================================
  // Post
  //=========================================================================================================
  /**
   *  Post request
   */
  public post(endpoint: string, payload?: any, options?: RequestInit) {
    return this.send("POST", endpoint, payload, options);
  }

  //=========================================================================================================
  // Put
  //=========================================================================================================
  /**
   *  Put request
   */
  public put(endpoint: string, payload?: any, options?: RequestInit) {
    return this.send("PUT", endpoint, payload, options);
  }

  //=========================================================================================================
  // Patch
  //=========================================================================================================
  /**
   *  Patch request
   */
  public patch(endpoint: string, payload?: any, options?: RequestInit) {
    return this.send("PATCH", endpoint, payload, options);
  }

  //=========================================================================================================
  // Delete
  //=========================================================================================================
  /**
   *  Delete request
   */
  public delete(endpoint: string, payload?: any, options?: RequestInit) {
    return this.send("DELETE", endpoint, payload, options);
  }

  //=========================================================================================================
  // Send
  //=========================================================================================================
  /**
   * @internal
   *  Will handle the request
   */
  private async send(
    method: string,
    endpoint: string,
    payload?: any,
    options?: RequestInit
  ): Promise<AgileResponse> {
    let fullUrl: string;
    let response: Response | undefined;
    let timedout = false;
    const config: apiConfig = copy(this.config); // Copying config because it will adapted for every specific request

    // Merge options together
    if (options) config.options = { ...config.options, ...options };

    // Inject method into request options
    config.options.method = method;

    // If no header set it to an empty object (because in some conditions we have to add some stuff to this object)
    // Haven't found a way by doing it with 'Headers'(https://stackoverflow.com/questions/48798236/const-initialization-error-with-requestinit-in-typescript)
    if (!config.options.headers) config.options.headers = {};

    // Set Body
    if (typeof payload === "object") {
      // Set body to stringyfied object payload
      config.options.body = JSON.stringify(payload);

      // Set content type of Header to json
      // @ts-ignore
      config.options.headers["content-type"] = "application/json";
    } else {
      // Set body to payload
      config.options.body = payload;
    }

    // Construct endpoint (fullUrl)
    let path = this.config.path ? "/" + this.config.path : "";
    if (endpoint.startsWith("http")) fullUrl = endpoint;
    else
      fullUrl = `${
        this.config.baseURL ? this.config.baseURL : ""
      }${path}/${endpoint}`;

    // Warning if fullUrl might not be valid
    if (!isValidUrl(fullUrl)) console.warn("No valid url ", fullUrl);

    // Send Request with timeout
    if (this.config.timeout) {
      let t: any;

      // Create timeout Promise
      const timeout = new Promise((resolve) => {
        t = setTimeout(() => {
          timedout = true;
          resolve(undefined);
        }, this.config.timeout);
      });

      // Create request Promise
      const request = new Promise((resolve, reject) => {
        fetch(fullUrl, this.config.options)
          .then((data) => {
            // Clear Timeout
            clearTimeout(t);

            // Resolve Response(data)
            resolve(data);
          })
          .catch(reject);
      });
      // @ts-ignore (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race)
      response = await Promise.race([timeout, request]);
    } else {
      // Send Request without timeout
      response = await fetch(fullUrl, this.config.options);
    }

    // Create FinalResponse
    let finalResponse: AgileResponse = {
      status: timedout ? 408 : response?.status || 404,
      raw: response,
      data: {},
      type: response?.headers?.get("content-type"),
      timedout: timedout,
    };

    // Extract response data
    if (finalResponse.type?.includes("application/json"))
      finalResponse.data = await finalResponse.raw?.json();
    else if (typeof finalResponse.raw?.text === "function")
      finalResponse.data = await finalResponse.raw.text();

    return finalResponse;
  }
}
