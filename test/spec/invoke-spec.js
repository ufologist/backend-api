describe('invoke', function() {
    var backendApi;

    beforeEach(function() {
        backendApi = new BackendApi(apiConfig);
    });

    function successCallback(result, textStatus, xhr) {
        // 使用 this 时, 要注意 jQuery 和 Zepto ajax 的实现不一样
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

    describe('callback', function() {
        beforeEach(function() {
            backendApi.setAsyncStyle('callback');
        });

        it('success', function(done) {
            backendApi.invoke('businessSuccess', {
                success: function(result, textStatus, xhr) {
                    successCallback.apply(this, arguments);
                    done();
                }
            });
        });
        it('error', function(done) {
            backendApi.invoke('error', {
                error: function(xhr, error, textStatus) {
                    errorCallback.apply(this, arguments);
                    done();
                }
            });
        });
    });

    describe('promise', function() {
        it('done', function(done) {
            backendApi.invoke('businessSuccess').done(function(result, textStatus, xhr) {
                successCallback.apply(this, arguments);
                done();
            });
        });
        it('then done', function(done) {
            backendApi.invoke('businessSuccess').then(function(result, textStatus, xhr) {
                successCallback.apply(this, arguments);
                done();
            });
        });
        it('fail', function(done) {
            backendApi.invoke('error').fail(function error(xhr, error, textStatus) {
                errorCallback.apply(this, arguments);
                done();
            });
        });
        it('then fail', function(done) {
            backendApi.invoke('error').then(null, function error(xhr, error, textStatus) {
                errorCallback.apply(this, arguments);
                done();
            });
        });
    });

    describe('global error', function() {
        it('only', function(done) {
            backendApi.setError(function(xhr, error, textStatus) {
                errorCallback.apply(this, arguments);
                done();
            });

            backendApi.invoke('error');
        });
        it('and callback error', function(done) {
            backendApi.setAsyncStyle('callback');

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
        it('and promise fail', function(done) {
            var errorInvokeTimes = 1;

            // 当 ajax 出错时, 会先执行 error 回调, 再执行 promise fail
            backendApi.setError(function(xhr, error, textStatus) {
                errorCallback.apply(this, arguments);
                expect(errorInvokeTimes).toBe(1);
                errorInvokeTimes++;
            });

            backendApi.invoke('error').then(null, function(xhr, error, textStatus) {
                errorCallback.apply(this, arguments);
                expect(errorInvokeTimes).toBe(2);
                done();
            });
        });
    });

    describe('successProcessor callback', function() {
        beforeEach(function() {
            backendApi.setAsyncStyle('callback');
        });

        it('success', function(done) {
            backendApi.setSuccessProcessor(successProcessor);

            backendApi.invoke('businessSuccess', {
                success: function(result, textStatus, xhr) {
                    afterSuccessProcessorSuccessCallback.apply(this, arguments);
                    done();
                }
            });
        });
        it('businessError', function(done) {
            backendApi.setSuccessProcessor(successProcessor);

            backendApi.invoke('businessError', {
                error: function(xhr, error, result) {
                    afterSuccessProcessorErrorCallback.apply(this, arguments);
                    done();
                }
            });
        });

        it('and global businessError', function(done) {
            backendApi.setSuccessProcessor(successProcessor);

            var errorInvokeTimes = 1;

            // 当出现业务错误时, callback 方式下, global error -> ajaxOptions.error
            backendApi.setError(function(xhr, error, textStatus) {
                afterSuccessProcessorErrorCallback.apply(this, arguments);
                expect(errorInvokeTimes).toBe(1);
                errorInvokeTimes++;
            });

            backendApi.invoke('businessError', {
                error: function(xhr, error, result) {
                    afterSuccessProcessorErrorCallback.apply(this, arguments);
                    expect(errorInvokeTimes).toBe(2);
                    done();
                }
            });
        });
    });

    describe('successProcessor promise', function() {
        it('done', function(done) {
            backendApi.setSuccessProcessor(successProcessor);

            backendApi.invoke('businessSuccess').done(function(result, textStatus, xhr) {
                afterSuccessProcessorSuccessCallback.apply(this, arguments);
                done();
            });
        });
        it('then done', function(done) {
            backendApi.setSuccessProcessor(successProcessor);

            backendApi.invoke('businessSuccess').then(function(result, textStatus, xhr) {
                afterSuccessProcessorSuccessCallback.apply(this, arguments);
                done();
            });
        });
        it('fail', function(done) {
            backendApi.setSuccessProcessor(successProcessor);

            backendApi.invoke('businessError').fail(function(xhr, error, result) {
                afterSuccessProcessorErrorCallback.apply(this, arguments);
                done();
            });
        });
        it('then fail businessError', function(done) {
            backendApi.setSuccessProcessor(successProcessor);

            backendApi.invoke('businessError').then(null, function(xhr, error, result) {
                afterSuccessProcessorErrorCallback.apply(this, arguments);
                done();
            });
        });

        it('and global error', function(done) {
            backendApi.setSuccessProcessor(successProcessor);

            var errorInvokeTimes = 1;

            // 当出现业务错误时, promise 方式下, global error -> promise fail 
            backendApi.setError(function(xhr, error, textStatus) {
                afterSuccessProcessorErrorCallback.apply(this, arguments);
                expect(errorInvokeTimes).toBe(1);
                errorInvokeTimes++;
            });

            backendApi.invoke('businessError').then(null, function(xhr, error, result) {
                afterSuccessProcessorErrorCallback.apply(this, arguments);
                expect(errorInvokeTimes).toBe(2);
                done();
            });
        });
    });
});