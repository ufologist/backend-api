describe('beforeSend', function() {
    var backendApi;
    var businessSuccessResult;

    beforeEach(function() {
        backendApi = new BackendApi(apiConfig);

        businessSuccessResult = {
            "status": 0,
            "data": {
                "user": {
                    "id": 1
                }
            }
        };
    });

    function successCallback(result, textStatus, xhr) {
        expect(this.url).toBe('fixtures/business-success.json');
        expect(result).toEqual(businessSuccessResult);
        expect(textStatus).toBe(undefined);
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

    it('beforeSend and successProcessor success', function(done) {
        backendApi.setBeforeSend(beforeSend);
        backendApi.setSuccessProcessor(function(result) {
            var _result = JSON.parse(JSON.stringify(result));
            _result.data.user.name = '我要修改下接口的数据';

            var processedResult = {
                success: true,
                result: _result
            };
            return processedResult;
        });

        backendApi.invoke('businessSuccess', {
            data: {
                // cache: true
            },
            success: function(result, textStatus, xhr) {
                expect(result.data.user.name).toBe('我要修改下接口的数据');
                done();
            }
        });
    });

    it('beforeSend and successProcessor promise', function(done) {
        backendApi.setBeforeSend(beforeSend);
        backendApi.setSuccessProcessor(function(result) {
            var _result = JSON.parse(JSON.stringify(result));
            _result.data.user.name = '我要修改下接口的数据';

            var processedResult = {
                success: true,
                result: _result
            };
            return processedResult;
        });

        backendApi.invoke('businessError', {
            data: {
                cache: true
            }
        }).done(function(result, textStatus, xhr) {
            expect(result.data.user.name).toBe('我要修改下接口的数据');
            done();
        });
    });
});