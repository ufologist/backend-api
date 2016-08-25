(function(global, $) {

/**
 * 一个用于与后端交互的数据层, 即统一地调用后端接口.
 * 
 * 这样做的好处在于对前端架构做初略的(MVC)分层: 视图层(View) -> 业务层(Controller) -> 数据层(Model)
 * 视图层只需要关注调用什么业务, 业务层负责将数据从数据层中取出来, 数据层做最底层的后端交互
 * 如果是比较简单的业务, 可以只需要视图层和数据层, 此时视图层承担了业务层的事情.
 * 
 * 例如下面的 MessageList 就相当于一个视图, 可以看作 Backbone 式的 MVC 模式
 * 注意: 我省略了构造 backendApi 的代码
 * function MessageList() {
 *     this.backendApi.invoke('getMessageList').then(this.render.bind(this));
 * }
 * MessageList.prototype.render = function(result) {
 *     // 在这里解析数据渲染视图, 你可能会在这里使用前端模版库, 或者简单的拼字符串
 * };
 * 
 * 当然如果你想足够简单, 也可以完全使用 jQuery 式直接操作 DOM, 不抽象出视图
 * $(function() {
 *     function renderMessageList() {
 *         this.backendApi.invoke('getMessageList').then(function(result) {
 *             // 在这里解析数据渲染视图
 *         });
 *     }
 * 
 *     renderMessageList();
 * });
 * 
 * 有一个统一的数据层, 即统一了数据输入和输出, 可以方便地做下面的事情
 * 1. 方便统一处理一些公共的行为, 例如请求超时, 请求失败, 未授权等等
 * 2. 方便知道前后端都使用了哪些接口
 * 3. 方便扩展功能, 例如添加缓存层
 * 
 * @param apiConfig {object}
 */
function BackendApi(apiConfig) {
    this.apiConfig = apiConfig;
    // this.middlewares = [];
}
BackendApi.prototype = {
    constructor: BackendApi,
    setApiConfig: function(apiConfig) {
        this.apiConfig = apiConfig;
    },
    setApi: function(name, config) {
        if (this.getApi(name)) {
            console.warn('覆盖了 API 配置:', name);
        }
        this.apiConfig[name] = config;
    },
    getApi: function(name) {
        return this.apiConfig[name];
    },
    /**
     * 调用后端接口
     * 
     * @param apiName {string} api name
     * @param options {object} ajax options
     */
    invoke: function(apiName, options) {
        var _options = options || {};

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

})(window, window.jQuery || window.Zepto);