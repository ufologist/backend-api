describe('beforeSend', function() {
    var backendApi;

    beforeEach(function() {
        backendApi = new BackendApi(apiConfig);
    });

    function successCallback(result, textStatus, xhr) {
        expect(this.url).toBe('fixtures/business-success.json');
        expect(result).toEqual(businessSuccessResult);
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
    function afterSuccessProcessorSuccessCallback(result, textStatus, xhr) {
        expect(this.url).toBe('fixtures/business-success.json');
        expect(result.data.user.name).toBe('我要修改下接口的数据');
        expect(textStatus).toBe('success');
        expect(xhr).toBe(undefined);
    }

    it('处理 ajaxOptions', function(done) {
        backendApi.setBeforeSend(beforeSend);

        backendApi.invoke('businessSuccess', {
            success: function(result, textStatus, xhr) {
                expect(this.cache).toBe(false);
                done();
            }
        });
    });

    it('阻止 ajax send success', function(done) {
        backendApi.setBeforeSend(beforeSend);

        backendApi.invoke('businessSuccess', {
            data: {
                cache: true
            },
            success: function(result, textStatus, xhr) {
                successCallback.apply(this, arguments);
                done();
            }
        });
    });
    it('阻止 ajax send promise', function(done) {
        backendApi.setBeforeSend(beforeSend);

        backendApi.invoke('businessSuccess', {
            data: {
                cache: true
            }
        }).then(function(result, textStatus, xhr) {
            successCallback.apply(this, arguments);
            done();
        });
    });

    it('and successProcessor success', function(done) {
        backendApi.setBeforeSend(beforeSend);
        backendApi.setSuccessProcessor(successProcessor);

        backendApi.invoke('businessSuccess', {
            data: {
                cache: true
            },
            success: function(result, textStatus, xhr) {
                afterSuccessProcessorSuccessCallback.apply(this, arguments);
                done();
            }
        });
    });

    it('and successProcessor promise', function(done) {
        backendApi.setBeforeSend(beforeSend);
        backendApi.setSuccessProcessor(successProcessor);

        backendApi.invoke('businessSuccess', {
            data: {
                cache: true
            }
        }).done(function(result, textStatus, xhr) {
            afterSuccessProcessorSuccessCallback.apply(this, arguments);
            done();
        });
    });
});