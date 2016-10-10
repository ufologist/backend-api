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
    function allowSendThenBusinessError(xhr, error, result) {
        // 经过处理的 ajaxOptions
        expect(this.cache).toBe(false);

        expect(error).toBe(BackendApi.BUSINESS_ERROR);
        expect(result).toEqual(businessErrorResult);
        expect(xhr).toBeTruthy();
    }
    function allowSendThenError(xhr, error, result) {
        // 经过处理的 ajaxOptions
        expect(this.cache).toBe(false);

        expect(this.url.indexOf('http://baidu.com') > -1).toBe(true);
        expect(error).not.toBe(BackendApi.BUSINESS_ERROR);
        expect(xhr).toBeTruthy();
    }
    function notAllowSendThenBusinessError(xhr, error, result) {
        // 经过处理的 ajaxOptions
        expect(this.url).toBe('NONEXISTENCE.json');

        expect(error).toBe(BackendApi.BUSINESS_ERROR);
        expect(result).toEqual(businessErrorResult);
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

            if (apiName == 'businessSuccess') {
                processedResult.result = businessSuccessResult;
            } else if (apiName == 'businessError') {
                processedResult.result = businessErrorResult;
            } else {
                processedResult.result = businessSuccessResult;
            }
        } else {
            ajaxOptions.cache = false;
        }

        return processedResult;
    }

    function successProcessor(result, textStatus, xhr) {
        var _result = JSON.parse(JSON.stringify(result));

        var processedResult = {
            success: true,
            result: _result
        };

        if (_result.status) {
            processedResult.success = false;
        } else {
            // 针对接口业务调用成功的情况下, 可以在 setSuccessProcessor 中做一些预处理
            // 例如解密数据
            _result.data.user.name = '我要修改下接口的数据';
        }

        return processedResult;
    }

    describe('不阻止发送 ajax 请求', function() {
        it('只是处理下 ajaxOptions', function(done) {
            backendApi.setAsyncStyle('callback');
            backendApi.setBeforeSend(beforeSend);

            backendApi.invoke('businessSuccess', {
                success: function(result, textStatus, xhr) {
                    allowSendThenSuccess.apply(this, arguments);
                    done();
                }
            });
        });

        it('和 successProcessor 一起使用 success 回调方式', function(done) {
            backendApi.setAsyncStyle('callback');
            backendApi.setBeforeSend(beforeSend);
            backendApi.setSuccessProcessor(successProcessor);

            backendApi.invoke('businessSuccess', {
                success: function(result, textStatus, xhr) {
                    allowSendThenSuccessWithSuccessProcessor.apply(this, arguments);
                    done();
                }
            });
        });
        it('和 successProcessor 一起使用 promise 方式', function(done) {
            backendApi.setBeforeSend(beforeSend);
            backendApi.setSuccessProcessor(successProcessor);

            backendApi.invoke('businessSuccess').done(function(result, textStatus, xhr) {
                allowSendThenSuccessWithSuccessProcessor.apply(this, arguments);
                done();
            });
        });
    });

    describe('阻止发送 ajax 请求', function() {
        it('success 回调方式', function(done) {
            backendApi.setAsyncStyle('callback');
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
        it('promise 方式', function(done) {
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
        it('和 successProcessor 一起使用 success 回调方式', function(done) {
            backendApi.setAsyncStyle('callback');
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
        it('和 successProcessor 一起使用 promise 方式', function(done) {
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

    describe('and error, successProcessor', function() {
        it('不阻止发送 ajax 请求, callback success', function(done) {
            backendApi.setAsyncStyle('callback');
            backendApi.setBeforeSend(beforeSend);
            backendApi.setSuccessProcessor(successProcessor);
            backendApi.setError(allowSendThenSuccessWithSuccessProcessor);

            backendApi.invoke('businessSuccess', {
                success: function(result, textStatus, xhr) {
                    allowSendThenSuccessWithSuccessProcessor.apply(this, arguments);
                    done();
                }
            });
        });
        it('不阻止发送 ajax 请求, callback businessError', function(done) {
            backendApi.setAsyncStyle('callback');
            backendApi.setBeforeSend(beforeSend);
            backendApi.setSuccessProcessor(successProcessor);
            backendApi.setError(function(xhr, error, result) {
                allowSendThenBusinessError.apply(this, arguments);

                expect(errorInvokeTimes).toBe(1);
                errorInvokeTimes++;
            });

            var errorInvokeTimes = 1;

            backendApi.invoke('businessError', {
                error: function(xhr, error, result) {
                    allowSendThenBusinessError.apply(this, arguments);

                    expect(errorInvokeTimes).toBe(2);
                    done();
                }
            });
        });
        it('不阻止发送 ajax 请求, callback error', function(done) {
            backendApi.setAsyncStyle('callback');
            backendApi.setBeforeSend(beforeSend);
            backendApi.setSuccessProcessor(successProcessor);
            backendApi.setError(function(xhr, error, result) {
                allowSendThenError.apply(this, arguments);

                expect(errorInvokeTimes).toBe(1);
                errorInvokeTimes++;
            });

            var errorInvokeTimes = 1;

            backendApi.invoke('error', {
                error: function(xhr, error, result) {
                    allowSendThenError.apply(this, arguments);

                    expect(errorInvokeTimes).toBe(2);
                    done();
                }
            });
        });
        it('不阻止发送 ajax 请求, promise then done', function(done) {
            backendApi.setBeforeSend(beforeSend);
            backendApi.setSuccessProcessor(successProcessor);
            backendApi.setError(allowSendThenSuccessWithSuccessProcessor);

            backendApi.invoke('businessSuccess')
                      .then(function(result, textStatus, xhr) {
                          allowSendThenSuccessWithSuccessProcessor.apply(this, arguments);
                          done();
                      });
        });
        it('不阻止发送 ajax 请求, promise then business fail', function(done) {
            backendApi.setBeforeSend(beforeSend);
            backendApi.setSuccessProcessor(successProcessor);
            backendApi.setError(function(xhr, error, result) {
                allowSendThenBusinessError.apply(this, arguments);

                expect(errorInvokeTimes).toBe(1);
                errorInvokeTimes++;
            });

            var errorInvokeTimes = 1;

            backendApi.invoke('businessError')
                      .then(null, function(xhr, error, result) {
                          allowSendThenBusinessError.apply(this, arguments);

                          expect(errorInvokeTimes).toBe(2);
                          done();
                      });
        });
        it('不阻止发送 ajax 请求, promise then fail', function(done) {
            backendApi.setBeforeSend(beforeSend);
            backendApi.setSuccessProcessor(successProcessor);
            backendApi.setError(function(xhr, error, result) {
                allowSendThenError.apply(this, arguments);

                expect(errorInvokeTimes).toBe(1);
                errorInvokeTimes++;
            });

            var errorInvokeTimes = 1;

            backendApi.invoke('error')
                      .then(null, function(xhr, error, result) {
                          allowSendThenError.apply(this, arguments);

                          expect(errorInvokeTimes).toBe(2);
                          done();
                      });
        });

        it('阻止发送 ajax 请求, callback success', function(done) {
            backendApi.setAsyncStyle('callback');
            backendApi.setBeforeSend(beforeSend);
            backendApi.setSuccessProcessor(successProcessor);
            backendApi.setError(notAllowSendThenSuccessWithSuccessProcessor);

            backendApi.invoke('businessSuccess', {
                data: {
                    cache: true
                },
                success: function(xhr, error, result) {
                    notAllowSendThenSuccessWithSuccessProcessor.apply(this, arguments);
                    done();
                }
            });
        });
        it('阻止发送 ajax 请求, callback businessError', function(done) {
            backendApi.setAsyncStyle('callback');
            backendApi.setBeforeSend(beforeSend);
            backendApi.setSuccessProcessor(successProcessor);
            backendApi.setError(function(xhr, error, result) {
                notAllowSendThenBusinessError.apply(this, arguments);
                expect(errorInvokeTimes).toBe(1);
                errorInvokeTimes++;
            });

            var errorInvokeTimes = 1;

            backendApi.invoke('businessError', {
                data: {
                    cache: true
                },
                error: function(xhr, error, result) {
                    notAllowSendThenBusinessError.apply(this, arguments);
                    expect(errorInvokeTimes).toBe(2);
                    done();
                }
            });
        });
        it('阻止发送 ajax 请求, promise then done', function(done) {
            backendApi.setBeforeSend(beforeSend);
            backendApi.setSuccessProcessor(successProcessor);
            backendApi.setError(notAllowSendThenBusinessError);

            backendApi.invoke('businessSuccess', {
                data: {
                    cache: true
                }
            }).then(function(xhr, error, result) {
                notAllowSendThenSuccessWithSuccessProcessor.apply(this, arguments);
                done();
            });
        });
        it('阻止发送 ajax 请求, promise then business fail', function(done) {
            backendApi.setBeforeSend(beforeSend);
            backendApi.setSuccessProcessor(successProcessor);
            backendApi.setError(function(xhr, error, result) {
                notAllowSendThenBusinessError.apply(this, arguments);
                expect(errorInvokeTimes).toBe(1);
                errorInvokeTimes++;
            });

            var errorInvokeTimes = 1;

            backendApi.invoke('businessError', {
                data: {
                    cache: true
                }
            }).then(null, function(xhr, error, result) {
                notAllowSendThenBusinessError.apply(this, arguments);
                expect(errorInvokeTimes).toBe(2);
                done();
            });
        });
    });
});