var apiConfig = {
    'error': { // 通信错误
        type: 'GET',
        url: 'http://baidu.com'
    },
    'businessSuccess': { // 业务成功
        type: 'GET',
        url: 'fixtures/business-success.json'
    },
    'businessError': { // 业务错误
        type: 'GET',
        url: 'fixtures/business-error.json'
    }
};

var businessSuccessResult = {
    "status": 0,
    "data": {
        "user": {
            "id": 1
        }
    }
};

var businessErrorResult = {
    "status": 1,
    "statusInfo": {
        "message": "param error"
    }
};