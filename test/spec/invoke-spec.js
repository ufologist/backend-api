describe('invoke', function() {
    var backendApi;

    beforeEach(function() {
        backendApi = new BackendApi(apiConfig);
    });

    function successCallback(result, textStatus, xhr) {
        // jQuery 和 Zepto ajax 的 context 不同, 因此如果想确保兼容性, 还是不要随意使用
        // jQuery context default is an object that represents the Ajax settings used in the call ($.ajaxSettings merged with the settings passed to $.ajax). 
        // Zepto context default: window
        expect(this.url).toBe('fixtures/business-success.json');
        expect(result).toEqual(businessSuccessResult);
        expect(textStatus).toBe('success');
    }
    function errorCallback(xhr, error, textStatus) {
        expect(this.url).toBe('http://baidu.com');
        expect(error).toBe('error');
    }

    function successProcessor(result, textStatus, xhr) {
        // successProcessor 就是一般的 successCallback, 也可以获取到 this
        console.log('successProcessor', this.type);

        var processedResult = {
            success: true,
            result: result
        };

        if (result.status) {
            processedResult.success = false;

            // 这里可以做一个全局的 toast 提示
            console.log('业务错误消息', result.statusInfo.message);

            if (result.code == 1) {
                // 处理错误1
            } else if (result.code == 2) {
                // 处理错误2
            }
        } else {
            // 针对接口业务调用成功的情况下, 可以在 setSuccessProcessor 中做一些预处理
            // 例如解密数据
            result.data.user.name = '我要修改下接口的数据';
        }

        return processedResult;
    }
    function afterSuccessProcessorSuccessCallback(result, textStatus, xhr) {
        expect(this.url).toBe('fixtures/business-success.json');
        expect(result.data.user.id).toBe(1);
        expect(result.data.user.name).toBe('我要修改下接口的数据');
        expect(textStatus).toBe('success');
    }
    function afterSuccessProcessorErrorCallback(xhr, error, result) {
        expect(this.url).toBe('fixtures/business-error.json');
        expect(error).toBe(BackendApi.BUSINESS_ERROR);
        expect(result).toEqual(businessErrorResult);
    }

    it('callback success', function(done) {
        backendApi.invoke('businessSuccess', {
            success: function(result, textStatus, xhr) {
                successCallback.apply(this, arguments);
                done();
            }
        });
    });
    it('callback error', function(done) {
        backendApi.invoke('error', {
            error: function(xhr, error, textStatus) {
                errorCallback.apply(this, arguments);
                done();
            }
        });
    });

    it('promise done', function(done) {
        backendApi.invoke('businessSuccess').done(function(result, textStatus, xhr) {
            successCallback.apply(this, arguments);
            done();
        });
    });
    it('promise then done', function(done) {
        backendApi.invoke('businessSuccess').then(function(result, textStatus, xhr) {
            successCallback.apply(this, arguments);
            done();
        });
    });
    it('promise fail', function(done) {
        backendApi.invoke('error').fail(function error(xhr, error, textStatus) {
            errorCallback.apply(this, arguments);
            done();
        });
    });
    it('promise then fail', function(done) {
        backendApi.invoke('error').then(null, function error(xhr, error, textStatus) {
            errorCallback.apply(this, arguments);
            done();
        });
    });

    it('global error only', function(done) {
        backendApi.setError(function(xhr, error, textStatus) {
            errorCallback.apply(this, arguments);
            done();
        });

        backendApi.invoke('error');
    });
    it('global error and ajax error', function(done) {
        var errorInvokeTimes = 1;

        backendApi.setError(function(xhr, error, textStatus) {
            errorCallback.apply(this, arguments);
            expect(errorInvokeTimes).toBe(1);
            errorInvokeTimes++;
        });

        backendApi.invoke('error', {
            error: function(xhr, error, textStatus) {
                errorCallback.apply(this, arguments);
                expect(errorInvokeTimes).toBe(2);

                done();
            }
        });
    });

    it('successProcessor success', function(done) {
        backendApi.setSuccessProcessor(successProcessor);

        backendApi.invoke('businessSuccess', {
            success: function(result, textStatus, xhr) {
                afterSuccessProcessorSuccessCallback.apply(this, arguments);
                done();
            }
        });
    });
    it('successProcessor error', function(done) {
        backendApi.setSuccessProcessor(successProcessor);

        backendApi.invoke('businessError', {
            error: function(xhr, error, result) {
                afterSuccessProcessorErrorCallback.apply(this, arguments);
                done();
            }
        });
    });

    it('successProcessor promise done', function(done) {
        backendApi.setSuccessProcessor(successProcessor);

        backendApi.invoke('businessSuccess').done(function(result, textStatus, xhr) {
            afterSuccessProcessorSuccessCallback.apply(this, arguments);
            done();
        });
    });
    it('successProcessor promise then done', function(done) {
        backendApi.setSuccessProcessor(successProcessor);

        backendApi.invoke('businessSuccess').then(function(result, textStatus, xhr) {
            afterSuccessProcessorSuccessCallback.apply(this, arguments);
            done();
        });
    });
    it('successProcessor promise fail', function(done) {
        backendApi.setSuccessProcessor(successProcessor);

        backendApi.invoke('businessError').fail(function(xhr, error, result) {
            afterSuccessProcessorErrorCallback.apply(this, arguments);
            done();
        });
    });
    it('successProcessor promise then fail', function(done) {
        backendApi.setSuccessProcessor(successProcessor);

        backendApi.invoke('businessError').then(null, function(xhr, error, result) {
            afterSuccessProcessorErrorCallback.apply(this, arguments);
            done();
        });
    });

    it('successProcessor success and promise', function(done) {
        var successInvokeTimes = 1;

        backendApi.setSuccessProcessor(successProcessor);

        backendApi.invoke('businessSuccess', {
            success: function(result, textStatus, xhr) {
                afterSuccessProcessorSuccessCallback.apply(this, arguments);
                expect(successInvokeTimes).toBe(1);
                successInvokeTimes++;
            }
        }).then(function(result, textStatus, xhr) {
            afterSuccessProcessorSuccessCallback.apply(this, arguments);
            expect(successInvokeTimes).toBe(2);
            done();
        });
    });
    it('successProcessor error and promise', function(done) {
        var errorInvokeTimes = 1;

        backendApi.setSuccessProcessor(successProcessor);

        backendApi.invoke('businessError', {
            error: function(xhr, error, result) {
                afterSuccessProcessorErrorCallback.apply(this, arguments);
                expect(errorInvokeTimes).toBe(1);
                errorInvokeTimes++;
            }
        }).then(null, function(xhr, error, result) {
            afterSuccessProcessorErrorCallback.apply(this, arguments);
            done();
        });
    });
});