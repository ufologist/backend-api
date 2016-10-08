describe('beforeSend', function() {
    var backendApi;

    beforeEach(function() {
        backendApi = new BackendApi(apiConfig);
    });

    function allowSendThenSuccess(result, textStatus, xhr) {
        // 经过处理的 ajaxOptions
        expect(this.cache).toBe(false);

        // 正常的返回结果
        expect(result).toEqual(businessSuccessResult);
        expect(textStatus).toBe('success');
        expect(xhr).toBeTruthy();
    }
    function notAllowSendThenSuccess(result, textStatus, xhr) {
        expect(this.url).toBe('NONEXISTENCE.json');
        expect(result).toEqual(businessSuccessResult);
        expect(textStatus).toBe('success');
        expect(xhr).toBe(undefined);
    }

    function allowSendThenSuccessWithSuccessProcessor(result, textStatus, xhr) {
        // 经过处理的 ajaxOptions
        expect(this.cache).toBe(false);

        // 经过 successProcessor 处理的结果
        expect(result.data.user.name).toBe('我要修改下接口的数据');
        expect(textStatus).toBe('success');
        expect(xhr).toBeTruthy();
    }
    function notAllowSendThenSuccessWithSuccessProcessor(result, textStatus, xhr) {
        expect(this.url).toBe('NONEXISTENCE.json');

        // 经过 successProcessor 处理的结果
        expect(result.data.user.name).toBe('我要修改下接口的数据');
        expect(textStatus).toBe('success');
        expect(xhr).toBe(undefined);
    }

    function beforeSend(apiName, api, ajaxOptions) {
        var processedResult = {
            allowSend: true
        };

        // 假如我先查找缓存, 如果有缓存则直接返回缓存数据, 就不发送 ajax 请求了
        if (ajaxOptions.data && ajaxOptions.data.cache) {
            processedResult.allowSend = false;
            // 假设我需要重新处理下 URL
            ajaxOptions.url = 'NONEXISTENCE.json';
            processedResult.result = businessSuccessResult;
        } else {
            ajaxOptions.cache = false;
        }

        return processedResult;
    }

    function successProcessor(result, textStatus, xhr) {
        var _result = JSON.parse(JSON.stringify(result));
        _result.data.user.name = '我要修改下接口的数据';

        var processedResult = {
            success: true,
            result: _result
        };
        return processedResult;
    }

    it('不阻止发送 ajax 请求, 只是处理下 ajaxOptions', function(done) {
        backendApi.setBeforeSend(beforeSend);

        backendApi.invoke('businessSuccess', {
            success: function(result, textStatus, xhr) {
                allowSendThenSuccess.apply(this, arguments);
                done();
            }
        });
    });

    it('阻止发送 ajax 请求, 直接调用 success', function(done) {
        backendApi.setBeforeSend(beforeSend);

        backendApi.invoke('businessSuccess', {
            data: {
                cache: true
            },
            success: function(result, textStatus, xhr) {
                notAllowSendThenSuccess.apply(this, arguments);
                done();
            }
        });
    });
    it('阻止发送 ajax 请求, 直接调用 promise', function(done) {
        backendApi.setBeforeSend(beforeSend);

        backendApi.invoke('businessSuccess', {
            data: {
                cache: true
            }
        }).then(function(result, textStatus, xhr) {
            notAllowSendThenSuccess.apply(this, arguments);
            done();
        });
    });

    it('不阻止发送 ajax 请求, 和 successProcessor 一起使用 success 回调方式', function(done) {
        backendApi.setBeforeSend(beforeSend);
        backendApi.setSuccessProcessor(successProcessor);

        backendApi.invoke('businessSuccess', {
            success: function(result, textStatus, xhr) {
                allowSendThenSuccessWithSuccessProcessor.apply(this, arguments);
                done();
            }
        });
    });
    it('不阻止发送 ajax 请求, 和 successProcessor 一起使用 promise 方式', function(done) {
        backendApi.setBeforeSend(beforeSend);
        backendApi.setSuccessProcessor(successProcessor);

        backendApi.invoke('businessSuccess').done(function(result, textStatus, xhr) {
            allowSendThenSuccessWithSuccessProcessor.apply(this, arguments);
            done();
        });;
    });

    it('阻止发送 ajax 请求, 和 successProcessor 一起使用 success 回调方式', function(done) {
        backendApi.setBeforeSend(beforeSend);
        backendApi.setSuccessProcessor(successProcessor);

        backendApi.invoke('businessSuccess', {
            data: {
                cache: true
            },
            success: function(result, textStatus, xhr) {
                notAllowSendThenSuccessWithSuccessProcessor.apply(this, arguments);
                done();
            }
        });
    });
    it('阻止发送 ajax 请求, 和 successProcessor 一起使用 promise 方式', function(done) {
        backendApi.setBeforeSend(beforeSend);
        backendApi.setSuccessProcessor(successProcessor);

        backendApi.invoke('businessSuccess', {
            data: {
                cache: true
            }
        }).then(function(result, textStatus, xhr) {
            notAllowSendThenSuccessWithSuccessProcessor.apply(this, arguments);
            done();
        });
    });
});