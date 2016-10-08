describe('API config', function() {
    it('constructor', function() {
        var backendApi = new BackendApi(apiConfig);

        expect(backendApi.apiConfig).toEqual(apiConfig);
    });

    it('setApiConfig', function() {
        var backendApi = new BackendApi();
        backendApi.setApiConfig(apiConfig);

        expect(backendApi.apiConfig).toEqual(apiConfig);
    });

    it('setApi', function() {
        var backendApi = new BackendApi();
        var testApiConfig = {
            type: 'GET',
            url: '/test'
        };
        backendApi.setApi('test', testApiConfig);

        expect(backendApi.getApi('test')).toEqual(testApiConfig);
        expect(backendApi.apiConfig).toEqual({
            'test': testApiConfig
        });
    });
});