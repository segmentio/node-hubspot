'use strict';

require('object.assign').shim();
var request = require('request');

var defaultBaseUrl = 'https://api.hubapi.com';

function Client(opts) {
  var self = this;

  self.opts = opts || {};
  self.accessToken;
  self.refreshToken;
  self.apiKey;
  self.clientId;
  self.clientSecret;
  self.baseUrl = defaultBaseUrl;

  function setAccessToken(accessToken) {
    if (!accessToken) {
      throw new Error('You must provide an access token.');
    }

    self.accessToken = accessToken;
  }

  function setClientId(clientId) {
    if (!clientId) {
      throw new Error('You must provide a client ID');
    }

    self.clientId = clientId;
  }

  function setClientSecret(clientSecret) {
    if (!clientSecret) {
      throw new Error('You must provide a client secret');
    }

    self.clientSecret = clientSecret;
  }

  function setRefreshToken(refreshToken) {
    if (!refreshToken) {
      throw new Error('You must provide a refresh token.');
    }

    self.refreshToken = refreshToken;
  }

  function setApiKey(apiKey) {
    if (!apiKey) {
      throw new Error('You must provide an API key.');
    }

    self.apiKey = apiKey;
  }

  function refreshAccessToken(cb) {
    if (!self.refreshToken) throw new Error('You must set a refresh token');
    if (!self.clientId) throw new Error('You must set a client ID');
    if (!self.clientSecret) throw new Error('You must set a client secret');

    sendRequest({
      method: 'POST',
      url: self.baseUrl + '/oauth/v1/token',
      form: {
        refresh_token: self.refreshToken,
        client_id: self.clientId,
        client_secret: self.clientSecret,
        grant_type: 'refresh_token'
      }
    }, { auth: false }, function(err, data, res) {
      if (err) {
        return cb(err);
      } else if (res && Math.floor(res.statusCode/100) !== 2) {
        return cb(new Error('Refresh access token error [' + res.statusCode + ']: ' + res.body));
      }

      self.accessToken = data.access_token;
      cb(null, data.access_token);
    });
  }

  function setBaseUrl(url) {
    self.baseUrl = url;
  }

  var contacts = {
    get: function(options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/contacts/v1/lists/all/contacts/all',
        qs: options,
        qsStringifyOptions: { indices: false }
      }, { auth: true }, cb);
    },
    getByEmail: function (email, cb) {
      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/contacts/v1/contact/email/' + email + '/profile'
      }, { auth: true }, cb);
    },
    getByEmailBatch: function (emails, cb) {
      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/contacts/v1/contact/emails/batch',
        qs: { email: emails },
        qsStringifyOptions: { indices: false }
      }, { auth: true }, cb);
    },
    getById: function (id, cb) {
      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/contacts/v1/contact/vid/' + id + '/profile'
      }, { auth: true }, cb);
    },
    update: function(id, data, cb) {
      sendRequest({
        method: 'POST',
        url: self.baseUrl + '/contacts/v1/contact/vid/' + id + '/profile',
        body: data
      }, { auth: true }, cb);
    },
    create: function (data, cb) {
      sendRequest({
        method: 'POST',
        url: self.baseUrl + '/contacts/v1/contact',
        body: data
      }, { auth: true }, cb);
    },
    // note: response to successful batch update is undefined by design : http://developers.hubspot.com/docs/methods/contacts/batch_create_or_update
    createOrUpdateBatch: function (data, cb) {
      sendRequest({
        method: 'POST',
        url: self.baseUrl + '/contacts/v1/contact/batch',
        body: data
      }, { auth: true }, cb);
    }
  };

  var contactProperties = {
    get: function (options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/contacts/v2/properties',
        qs: options
      }, { auth: true }, cb);
    }
  };

  var lists = {
    get: function(options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/contacts/v1/lists',
        qs: options
      }, { auth: true }, cb);
    },
    getOne: function(id, cb) {
      if (!id || typeof(id) === 'function') {
        return cb(new Error("id parameter must be provided."));
      }

      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/contacts/v1/lists/' + id,
      }, { auth: true }, cb);
    },
    getContacts: function(id, options, cb) {
      if (!id || typeof(id) === 'function') {
        return cb(new Error("id parameter must be provided."));
      }

      if (typeof(options) === 'function') {
        cb = options;
        options = {};
      }

      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/contacts/v1/lists/' + id + '/contacts/all',
        qs: options,
        qsStringifyOptions: { indices: false }
      }, { auth: true }, cb);
    },
    getRecentContacts: function(id, options, cb) {
      if (!id || typeof(id) === 'function') {
        return cb(new Error("id parameter must be provided."));
      }

      if (typeof(options) === 'function') {
        cb = options;
        options = {};
      }
      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/contacts/v1/lists/' + id + '/contacts/recent',
        qs: options,
        qsStringifyOptions: { indices: false }
      }, { auth: true }, cb);
    },
    addContacts: function(id, contactBody, cb) {
      if (!id || typeof(id) === 'function') {
        return cb(new Error("id parameter must be provided."));
      }
      if (!contactBody || typeof(contactBody) === 'function') {
        return cb(new Error("contactBody parameter must be provided."));
      }

      var body = contactBody;

      sendRequest({
        method: 'POST',
        url: self.baseUrl + '/contacts/v1/lists/' + id + '/add',
        body: body
      }, { auth: true }, cb);
    }
  };

  var campaigns = {
    get: function(options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/email/public/v1/campaigns',
        qs: options
      }, { auth: true }, cb);
    },
    getById: function(options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/email/public/v1/campaigns/by-id',
        qs: options
      }, { auth: true }, cb);
    },
    getOne: function(id, appId, cb) {
      if (!id || typeof id === "function") {
        return cb(new Error("id parameter must be provided."));
      }

      if (typeof appId === "function") {
        cb = appId;
        appId = null;
      }

      var call = {
        method: 'GET',
        url: self.baseUrl + '/email/public/v1/campaigns/' + id
      };

      if (appId) {
        call.qs = {
          appId: appId
        }
      }

      sendRequest(call, { auth: true }, cb);
    },
    events: function(options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/email/public/v1/events',
        qs: options
      }, { auth: true }, cb);
    }
  };

  var companies = {
    get: function(options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/companies/v2/companies/paged',
        qs: options,
        useQuerystring: true
      }, { auth: true }, cb);
    },

    getOne: function(id, cb) {
      if (!id || typeof(id) === 'function') {
        return cb(new Error("id parameter must be provided."));
      }

      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/companies/v2/companies/' + id
      }, { auth: true }, cb);
    },

    getRecentlyCreated: function(options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/companies/v2/companies/recent/created',
        qs: options
      }, { auth: true }, cb);
    },

    getRecentlyModified: function(options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/companies/v2/companies/recent/modified',
        qs: options
      }, { auth: true }, cb);
    },

    getProperties: function(cb) {
      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/properties/v1/companies/properties'
      }, { auth: true }, cb);
    }
  };

  var deals = {
    get: function(options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/deals/v1/deal/paged',
        qs: options,
        useQuerystring: true
      }, { auth: true }, cb);
    },

    getOne: function(id, cb) {
      if (!id || typeof(id) === 'function') {
        return cb(new Error("id parameter must be provided."));
      }

      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/deals/v1/deal/' + id
      }, { auth: true }, cb);
    },

    getRecentlyModified: function(options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/deals/v1/deal/recent/modified',
        qs: options
      }, { auth: true }, cb);
    },

    getProperties: function(cb) {
      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/properties/v1/deals/properties'
      }, { auth: true }, cb);
    }
  };

  var broadcasts = {
    get: function(options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/broadcast/v1/broadcasts',
        qs: options
      }, { auth: true }, cb);
    }
  };

  var subscriptions = {
    get: function(options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/email/public/v1/subscriptions/timeline',
        qs: options
      }, { auth: true }, cb);
    }
  };

  var files = {
    get: function(cb) {
      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/filemanager/api/v2/files'
      }, { auth: true }, cb);
    },
    getOne: function(id, cb) {
      if (!id || typeof(id) === 'function') {
        return cb(new Error("id parameter must be provided."));
      }

      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/filemanager/api/v2/files/' + id,
      }, { auth: true }, cb);
    }
  };

  var pipelines = {
    get: function(options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      sendRequest({
        method: 'GET',
        url: self.baseUrl + '/deals/v1/pipelines',
        qs: options,
      }, { auth: true }, cb);
    }
  };

  function sendRequest (call, opts, cb) {
    call.json = true;
    call.qs = call.qs || {};

    if (opts.auth) {
      if (self.apiKey) {
        call.qs.hapikey = self.apiKey;
      } else if (self.accessToken) {
        if (typeof call.headers !== "object") {
          call.headers = {};
        }
        call.headers["Authorization"] = "Bearer " + self.accessToken;
      } else {
        return cb(new Error("You need to provide either a token or a key."));
      }
    }

    Object.assign(call, self.opts.request);

    request(call, handleResponse(cb));
  }

  function handleResponse (cb) {
    return function (err, res, data) {
      if (err) return cb(err);
      return cb(null, res.body, res);
    }
  }

  return {
    campaigns: campaigns,
    subscriptions: subscriptions,
    contacts: contacts,
    contactProperties: contactProperties,
    companies: companies,
    deals: deals,
    broadcasts: broadcasts,
    lists: lists,
    pipelines: pipelines,
    files: files,
    setAccessToken: setAccessToken,
    setRefreshToken: setRefreshToken,
    setApiKey: setApiKey,
    setClientId: setClientId,
    setClientSecret: setClientSecret,
    refreshAccessToken: refreshAccessToken,
    setBaseUrl: setBaseUrl
  }
}

module.exports = Client;

