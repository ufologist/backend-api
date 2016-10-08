/**
 * backend-api
 * 
 * 一个用于与后端交互的数据层, 即统一地调用后端接口.
 * 
 * @version 1.1.0 2016-10-8
 * @author https://github.com/ufologist/backend-api
 * @licence MIT (c) 2016 Sun
 */
(function(global, $) {

/**
 * 设置 ajax 的 error callback
 */
function setErrorCallback(ajaxOptions, globalError) {
    var optionError = ajaxOptions.error;

    // error callback 有如下情况
    // 
    // true  optionError | true  globalError 此时先执行 globalError 再执行 optionError
    // true  optionError | false globalError 此时只执行 optionError
    // false optionError | true  globalError 此时只执行 globalError
    // false optionError | false globalError 此时什么都不做
    if (optionError && globalError) {
        // 如果有全局的 error 又有自己设置的 error, 则依次执行(先执行全局的, 再执行自己的)
        ajaxOptions.error = function(xhr, error, textStatusOrResult) {
            globalError.apply(this, arguments);
            optionError.apply(this, arguments);
        };
    } else if (globalError) {
        ajaxOptions.error = globalError;
    }
}

/**
 * 在 callback 模式中使用 successProcessor
 */
function useSuccessProcessorInCallback(ajaxOptions, successProcessor) {
    var successCallback = ajaxOptions.success;
    var errorCallback = ajaxOptions.error;

    if (successCallback || errorCallback) {
        ajaxOptions.success = function(result, textStatus, xhr) {
            if (successProcessor) {
                var processedResult = successProcessor.apply(this, arguments) || {};
                var _result = processedResult.result || result;

                if (processedResult.success) {
                    successCallback && successCallback.call(this, _result, textStatus, xhr);
                } else {
                    errorCallback && errorCallback.call(this, xhr, BackendApi.BUSINESS_ERROR, _result);
                }
            } else {
                successCallback && successCallback.apply(this, arguments);
            }
        };
    }
}

/**
 * 在 promise 模式中使用 successProcessor
 */
function useSuccessProcessorInPromise(jqxhr, successProcessor) {
    promise = jqxhr.then(function(result, textStatus, xhr) {
        var dfd = $.Deferred();

        if (successProcessor) {
            var processedResult = successProcessor.apply(this, arguments) || {};
            var _result = processedResult.result || result;

            if (processedResult.success) {
                dfd.resolveWith(this, [_result, textStatus, xhr]);
            } else {
                dfd.rejectWith(this, [xhr, BackendApi.BUSINESS_ERROR, _result]);
            }
        } else {
            dfd.resolveWith(this, [result, textStatus, xhr]);
        }

        return dfd.promise();
    });

    return promise;
}

/**
 * 调用 beforeSend 包装返回值
 */
function useBeforeSend(apiName, api, ajaxOptions) {
    var beforeSendResult = {
        allowSend: true
    };

    if (this.beforeSend) {
        var processedResult = this.beforeSend(apiName, api, ajaxOptions) || {};
        beforeSendResult.allowSend = processedResult.allowSend;

        // 不发送请求的情况, 例如直接从缓存中找到数据了, 就直接返回缓存数据
        if (!processedResult.allowSend) {
            if (typeof processedResult.result != 'undefined') {
                // 如果有返回结果则直接调用 success callback
                if (ajaxOptions.success) {
                    // 通过 setTimeout 延时确保 ajax 回调始终是异步执行的
                    setTimeout(function() {
                        ajaxOptions.success.call(ajaxOptions, processedResult.result);
                    });
                }

                // 对于支持 promise 模式的就返回一个 promise
                if ($.Deferred) {
                    beforeSendResult.result = $.Deferred()
                                               .resolveWith(ajaxOptions, [processedResult.result])
                                               .promise();
                } else { // TODO 需要确保返回的数据对象吗?
                    beforeSendResult.result = new XMLHttpRequest();
                }
            }
            // TODO 存在这样一种情况: 我不想发送 ajax, 也不返回数据?
            // 现在的情况是当 allowSend: false 时, result 应该是有值的, 否则代码就可能会出错
            // 例如回调的模式还好, 没有依赖返回值, 如果是 promise 模式
            // 那么代码就有问题了
            // backendApi.invoke('test').done();
            // allowSend 为 false 的情况下, invoke 返回值为 null
            // TODO 如果 beforeSend 没有返回 result, 那应该返回什么东西呢?
        }
    }

    return beforeSendResult;
}

/**
 * 后端接口
 * 
 * @param apiConfig {object} 所有后端接口的配置
 */
function BackendApi(apiConfig) {
    this.apiConfig = apiConfig || {};
    // 统一的前置处理
    this.beforeSend = null;
    // 统一的成功处理
    this.successProcessor = null;
    // 统一的错误处理
    this.error = null;

    // TODO 是否可以考虑实现像 express 一样的 middleware 机制?
    // 例如通过中间件机制实现缓存
    // this.middlewares.push(middleware);
}
BackendApi.prototype = {
    constructor: BackendApi,
    /**
     * (覆盖)配置所有的后端接口
     * 
     * @param apiConfig {object}
     */
    setApiConfig: function(apiConfig) {
        this.apiConfig = apiConfig;
    },
    /**
     * 新增或者修改一个后端接口的配置
     * 
     * @param name {string}
     * @param config {object}
     */
    setApi: function(name, config) {
        if (this.getApi(name)) {
            console.warn('覆盖了 API 配置', name);
        }
        this.apiConfig[name] = config;
    },
    /**
     * 获取一个后端接口的配置
     * 
     * @param name {string}
     * @return 后端接口的配置 {object}
     */
    getApi: function(name) {
        return this.apiConfig[name];
    },
    /**
     * 设置统一的通信错误处理函数(通信错误指 HTTP 层的错误客户端错误, 例如下面提到的 error)
     * 
     * if there is an error (timeout, parse error, or status code not in HTTP 2xx)
     * 
     * Possible values for the second argument (besides null) are "timeout", "error", "abort", and "parsererror"
     * 
     * When an HTTP error occurs, errorThrown receives the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error." As of jQuery 1.5, the error setting can accept an array of functions. Each function will be called in turn. Note: This handler is not called for cross-domain script and cross-domain JSONP requests.
     * 
     * @param error {Function} (jqXHR jqXHR, String error, String textStatus)
     * 
     * 例如
     * // error 为 BUSINESS_ERROR 时属于业务错误, 而非通信层的错误
     * function(xhr, error, textStatus) {
     *    console.log(xhr, error, textStatus);
     * }
     */
    setError: function(error) {
        this.error = error;
    },
    /**
     * 设置接口调用成功后预处理接口数据的函数
     * 
     * 一般我们的使用场景有
     * - 解密接口返回的数据
     * - 缓存接口数据
     * - 统一处理错误码(以前我们可能通过 ajaxComplete 全局事件来实现)
     * 
     * 这个处理函数与一般的 success callback 运作机制是一样, 只是会先于 ajax 中设置的 success callback,
     * 这样就便于统一在一个地方处理接口返回的数据
     * 
     * 例如接口返回的是加密文本(虽然没什么意义), 必须解密后才能使用.
     * 以往我们可能需要在每个 ajax success callback 中处理解密的逻辑,
     * 现在通过 successProcessor 机制, 就可以统一解密了, 对调用接口者来说, 完全感知不到接口是加密的,
     * 很好地屏蔽了底层的实现.
     * 
     * @param error {Function} (result, textStatus, xhr)
     * 
     * successProcessor 方法的参数与一般的 success callback 一致,
     * 必须返回一个 object, 包含 success, result 这两个字段.
     * 当 success 为 true 时才会继续执行 ajax 中设置的 success callback,
     * 此时可以预处理原来接口返回的数据 result, 而返回一个新的或者修改过的 result,
     * 当 success 为 false 时会执行 ajax 中设置的 error callback.
     * 
     * 例如
     * function(result, textStatus, xhr) {
     *     var processedResult = {
     *         success: true,
     *         result: result
     *     };
     *     return processedResult;
     * }
     */
    setSuccessProcessor: function(successProcessor) {
        this.successProcessor = successProcessor;
    },
    /**
     * 可以在调用接口(发送请求)之前做的事情
     * 
     * 一般我们的使用场景有
     * - 封装统一的请求参数(以前我们可能通过 jQuery.ajaxPrefilter 来实现)
     * - 请求参数加密
     * - 检测是否有接口的缓存数据
     * 
     * @param error {Function} (apiName, api, ajaxOptions)
     * 
     * beforeSend 必须返回一个 object, 包含 allowSend, result 这两个字段.
     * 当 allowSend 为 true 时才会继续发送 ajax 请求调用接口,
     * 当 allowSend 为 false 时不会继续执行 ajax, 而是直接执行 success 或者返回 promise 携带 result,
     * 此时相当于拦截请求, 非常适合提取缓存数据的逻辑.
     * 
     * 例如
     * function(apiName, api, ajaxOptions) {
     *     var processedResult = {
     *         allowSend: true,
     *         result: result
     *     };
     *     return processedResult;
     * }
     */
    setBeforeSend: function(beforeSend) {
        this.beforeSend = beforeSend;
    },
    /**
     * 调用后端接口
     * 
     * 大致流程如下                                                 ╭━> success
     *                                    ╭━> successProcessor ━┫                   
     *              ╭━> true  -> ajax ━┫                       ╰━>  error
     * beforeSend ━┫                    ╰━> error
     *              ╰━> false -> successProcessor
     * 
     * @param apiName {string} API name
     * @param options {object} ajax options
     */
    invoke: function(apiName, options) {
        var api = this.getApi(apiName);
        if (!api) {
            console.warn('未找到匹配的 API');
            return;
        }

        var ajaxOptions = $.extend({
            // 将 api 配置中与 ajax 有关的参数单独提出来,
            // 防止以后扩展参数的过程中出现与 ajax 参数冲突.
            // 例如以后想扩展出 api.cache 参数用于配置缓存,
            // 而 ajax 参数也有一个一样的参数, 就会出现冲突了
            type: api.type,
            url: api.url
        }, options);

        setErrorCallback(ajaxOptions, this.error);
        // 有可能同时存在回调和 promise 两种方式
        useSuccessProcessorInCallback(ajaxOptions, this.successProcessor);

        var result = useBeforeSend.call(this, apiName, api, ajaxOptions);
        if (!result.allowSend) {
            return result.result;
        }

        // 推荐使用 Promise 模式
        // 如果是基于 Zepto, 需要添加额外的 deferred 模块; jQuery 1.5+ 默认支持 Promise 模式
        var ajaxReturn;
        if ($.Deferred) {
            ajaxReturn = $.ajax(ajaxOptions);
            ajaxReturn = useSuccessProcessorInPromise(ajaxReturn, this.successProcessor);
        } else {
            ajaxReturn = $.ajax(ajaxOptions);
        }

        return ajaxReturn;
    }
};
BackendApi.BUSINESS_ERROR = 'businessError';

global.BackendApi = BackendApi;

})(window, window.jQuery || window.Zepto); // 依赖 jQuery 或者 Zepto 提供底层的 ajax