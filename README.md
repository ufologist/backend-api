# backend-api

[![version][version]][source-url] [![changelog][changelog-image]][changelog-url] [![license][license-image]][license-url]

[version]: https://img.shields.io/badge/v-1.1.0-blue.svg?style=flat-square
[source-url]: https://github.com/ufologist/backend-api/blob/master/backend-api.js
[license-image]: https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square
[license-url]: https://github.com/ufologist/backend-api/blob/master/LICENSE
[changelog-image]: https://img.shields.io/badge/CHANGE-LOG-blue.svg?style=flat-square
[changelog-url]: https://github.com/ufologist/backend-api/blob/master/CHANGELOG.md

一个用于与后端交互的数据层, 即统一地调用后端接口.

## 为什么需要统一调用后端接口

这样做的好处在于对前端架构做初略的(MVC)分层: 展现层(View) -> 业务层(Controller) -> 数据层(Model)

展现层只需要知道自己要做什么事(这个所谓的事就是业务了)就可以了, 业务层来处理这个事情涉及到的业务流程. 例如展现层做注册, 那么展现层只要调用业务层提供的注册业务就好了, 不需要关心注册涉及到的业务逻辑. 这样各层做的事情就会职责分明, 具备单一职责原则, 各层配合也就清晰明了了, 代码逻辑自然理得很顺. 分层架构其实是在应对计算机领域经典的理论, 分解复杂度, 将复杂的事情分解为一件件相对简单的事, 各个击破.

简而言之: 展现层(视图层)只需要关注调用什么业务, 业务层负责将数据从数据层中取出来, 数据层做最底层的后端交互.

如果是比较简单的业务, 可以只需要视图层和数据层, 此时视图层承担了业务层的事情.

例如下面的 MessageList 就相当于一个视图, 可以看作 Backbone 式的 MVC 模式

注意: 我省略了构造 backendApi 的代码

```javascript
function MessageList() {
    this.backendApi.invoke('getMessageList').then(this.render.bind(this));
}
MessageList.prototype.render = function(result) {
    // 在这里解析数据渲染视图, 你可能会在这里使用前端模版库, 或者简单的拼字符串
};
```

当然如果你想足够简单, 也可以完全使用 jQuery 式直接操作 DOM, 不抽象出视图

```javascript
$(function() {
    function renderMessageList() {
        this.backendApi.invoke('getMessageList').then(function(result) {
            // 在这里解析数据渲染视图
        });
    }

    renderMessageList();
});
```

有一个统一的数据层, 即统一了数据输入和输出, 可以方便地做下面的事情

* 方便统一处理一些公共的行为, 例如请求超时, 请求失败, 未授权等等
* 方便知道前后端都使用了哪些接口
* 方便扩展功能, 例如添加缓存层

## 使用方法

```html
<!-- 依赖 jQuery 或者 Zepto 提供底层的 ajax 功能, 推荐使用 Promise 模式 -->
<script src="http://cdn.bootcss.com/jquery/3.1.0/jquery.min.js"></script>
<script src="http://rawgit.com/ufologist/backend-api/master/backend-api.js"></script>
<script>
// 配置后端接口
var backendApi = new BackendApi({
    'getMessageList': {
        type: 'GET',
        url: '/api/message'
    },
    'createMessage': {
        type: 'POST',
        url: '/api/message'
    },
    'getUserAgent': {
        type: 'GET',
        url: 'http://httpbin.org/user-agent'
    }
});
// 设置统一的前置处理
backendApi.setBeforeSend(function(apiName, api, ajaxOptions) {
    console.log('1 backendApi beforeSend', arguments);

    var processedResult = {
        allowSend: true,
        result: null
    };
    return processedResult;
});
// 设置统一的成功处理
backendApi.setSuccessProcessor(function(result, textStatus, xhr) {
    console.log('2.1 backendApi success', arguments);

    var processedResult = {
        success: true,
        result: result
    };
    return processedResult;
});
// 设置统一的错误处理
backendApi.setError(function(xhr, error, textStatusOrResult) {
    console.log('2.2 backendApi error', arguments);
});

// 调用后端接口
backendApi.invoke('getMessageList').then(function(result) {
    console.log('createMessage', result);
});

backendApi.invoke('createMessage', { // support full jQuery ajax options
    data: {
        title: 'msg title',
        content: 'msg content'
    }
}).then(function(result) {
    console.log('createMessage', result);
});

backendApi.invoke('getUserAgent').then(function(result) {
    console.log('getUserAgent', result);
});

// 更多示例请参考 test/spec 中的测试用例
</script>
```

## 参考

* 项目经验

  > 在一些 SPA(Single Page App) 中, 做一个业务代理层(business delegate)用于调用后端接口.
  >
  > 此时需要统一处理一些事情
  > * 配置后端接口(区分本地模式和远程模式)
  > * 封装统一的请求参数, 例如版本号, 项目名等等
  > * 计算请求参数的签名, 并将所有参数加密(对称加密方式)后再传输
  > * 解密接口返回的数据
  > * 缓存接口数据(TTL方式, 分 Infinity 永久缓存和时效缓存, 以接口和请求参数为缓存的 key)
  > * 统一处理错误码

* [AmplifyJS](https://github.com/mikehostetler/amplify)

  > Request | Store | Pub/Sub
  >
  > AmplifyJS solves the following problems:
  > * **Ajax Request Management**
  > 
  >   `amplify.request` provides a clean and elegant request abstraction for all types of data, even allowing for transformation prior to consumption.
  >
  >   ```javascript
  >   amplify.request.define('ajaxExample1', 'ajax', {
  >       url: '/myApiUrl',
  >       dataType: 'json',
  >       type: 'GET'
  >   });
  >   
  >   amplify.request('ajaxExample1', function(result) {
  >       console.log(result);
  >   });
  >   ```
  >
  > * **Client Side Component Communication**
  >
  >   `amplify.publish/subscribe` provides a clean, performant API for component to component communication.
  >
  > * **Client Side Browser & Mobile Device Storage**
  >
  >   `amplify.store` takes the confusion out of HTML5 localStorage. It doesn't get simpler than using amplify.store(key, data)! It even works flawlessly on mobile devices.