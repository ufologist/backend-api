/**
 * backend-api
 * 
 * 一个用于与后端交互的数据层, 即统一地调用后端接口.
 * 
 * @version 1.0.0
 * @author https://github.com/ufologist/backend-api
 * @licence MIT (c) 2016 Sun
 */
(function(global, $) {

/**
 * 后端接口
 * 
 * @param apiConfig {object} 所有后端接口的配置
 */
function BackendApi(apiConfig) {
    this.apiConfig = apiConfig;
    // 统一的错误处理
    this.error = null;
    // this.middlewares = [];
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
     * 配置一个后端接口
     * 
     * @param name {string}
     * @param config {object}
     */
    setApi: function(name, config) {
        if (this.getApi(name)) {
            console.warn('覆盖了 API 配置:', name);
        }
        this.apiConfig[name] = config;
    },
    /**
     * 获取一个后端接口的配置
     * 
     * @param name {string}
     * @returns 后端接口的配置
     */
    getApi: function(name) {
        return this.apiConfig[name];
    },
    /**
     * 设置统一的错误处理函数
     * 
     * @param error {Function}
     */
    setError: function(error) {
        this.error = error;
    },
    /**
     * 调用后端接口
     * 
     * @param apiName {string} api name
     * @param options {object} ajax options
     */
    invoke: function(apiName, options) {
        var _options = $.extend({
            error: this.error
        }, options);

        var api = this.getApi(apiName);
        if (!api) {
            console.warn('未找到匹配的API');
            return;
        }

        var ajaxOptions = $.extend({
            // 将 api 配置中与 ajax 有关的参数单独提出来,
            // 防止以后扩展参数的过程中出现与 ajax 参数冲突.
            // 例如以后想扩展出 api.cache 参数用于配置缓存,
            // 而 ajax 参数也有一个一样的参数, 就会出现冲突了
            type: api.type,
            url: api.url
        }, _options);

        // 推荐使用 Promise 模式, 如果使用的是 Zepto, 需要使用
        return $.ajax(ajaxOptions);
    },
    use: function(middleware) {
        // TODO 是否可以考虑实现像 express 一样的 middleware 机制?
        // 例如通过中间件机制实现缓存
        // this.middlewares.push(middleware);
    }
};

global.BackendApi = BackendApi;

})(window, window.jQuery || window.Zepto); // 依赖 jQuery 或者 Zepto 提供底层的 ajax