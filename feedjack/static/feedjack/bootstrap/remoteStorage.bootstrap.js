// Generated by CoffeeScript 1.3.3
(function() {
  var localStorage_prefix, receive_token_url, script, site_key, storage_category;

  script = $('script').last();

  site_key = $('script').last().data('site_key');

  localStorage_prefix = "feedjack." + site_key + ".rs";

  storage_category = "feedjack.fold";

  receive_token_url = script.data('receive_token_url');

  $(document).ready(function() {
    var Storage, authorized, connect_handler, connected, rs_form, state_update_hook, storage;
    rs_form = $('#rs-form');
    rs_form.click(function(ev) {
      return ev.stopPropagation();
    });
    if (!(receive_token_url != null)) {
      console.log('Failed to find receive_token', +' interface URL, remoteStorage interface will be disabled.');
      rs_form.find('input, .btn').addClass('disabled').attr('disabled', 'disabled');
      return;
    }
    Storage = (function() {

      Storage.auth_callback = null;

      function Storage(category) {
        var _this = this;
        this.category = category;
        $(window).on('message', function(ev) {
          ev = ev.originalEvent;
          if (ev.origin === location.protocol + '//' + location.host) {
            console.log('Received an OAuth token: ' + ev.data);
            localStorage.setItem("" + localStorage_prefix + ".bearerToken", ev.data);
            if (_this.auth_callback != null) {
              return _this.auth_callback();
            }
          }
        });
      }

      Storage.prototype.connect = function(user_address, callback) {
        return remoteStorage.getStorageInfo(user_address, function(error, storageInfo) {
          if (error) {
            alert('Could not load storage info');
            console.log(error);
          } else {
            console.log('Storage info received:');
            console.log(storageInfo);
          }
          return callback(error, storageInfo);
        });
      };

      Storage.prototype.authorize = function(scopes, callback) {
        var redirectUri, storageInfo;
        if (scopes == null) {
          scopes = [this.category + ':rw'];
        }
        storageInfo = JSON.parse(localStorage.getItem("" + localStorage_prefix + ".userStorageInfo"));
        redirectUri = location.protocol + '//' + location.host + receive_token_url;
        this.auth_callback = callback;
        return window.open(remoteStorage.createOAuthAddress(storageInfo, scopes, redirectUri));
      };

      Storage.prototype.get = function(key, callback) {
        var client, path, storageInfo, token;
        storageInfo = JSON.parse(localStorage.getItem("" + localStorage_prefix + ".userStorageInfo"));
        token = localStorage.getItem("" + localStorage_prefix + ".bearerToken");
        if (!(storageInfo != null) || !(token != null)) {
          alert('No remoteStorage authorization, please connect/authorize first.');
          return callback(401);
        }
        path = this.category + '/' + key;
        client = remoteStorage.createClient(storageInfo, '', token);
        return client.get(path, function(error, data) {
          if (error === 401) {
            alert('Your session has expired. Please connect to your remoteStorage again.');
          } else {
            if (error) {
              alert('Could not find "' + path + '" on the remoteStorage');
              console.log(error);
            } else {
              if (!(data != null)) {
                console.log('There wasn\'t anything for "' + path + '"');
              } else {
                console.log('Received item "' + path + '": ' + data);
              }
            }
          }
          return callback(error, data);
        });
      };

      Storage.prototype.put = function(key, value, callback) {
        var client, path, storageInfo, token;
        storageInfo = JSON.parse(localStorage.getItem("" + localStorage_prefix + ".userStorageInfo"));
        path = this.category + '/' + key;
        token = localStorage.getItem("" + localStorage_prefix + ".bearerToken");
        client = remoteStorage.createClient(storageInfo, '', token);
        return client.put(path, value, function(error) {
          if (error === 401) {
            alert('Your session has expired. Please connect to your remoteStorage again.');
          } else {
            if (error) {
              alert('Could not store "' + path + '"');
              console.log(error);
            } else {
              console.log('Stored "' + value + '" for item "' + path + '"');
            }
          }
          return callback(error);
        });
      };

      return Storage;

    })();
    storage = new Storage(storage_category);
    $(document).trigger('fold_storage_init', storage);
    connected = localStorage.getItem("" + localStorage_prefix + ".userStorageInfo") !== null;
    authorized = localStorage.getItem("" + localStorage_prefix + ".bearerToken") !== null;
    state_update_hook = function() {
      if (connected) {
        rs_form.find('input[name="userAddress"]').val(localStorage.getItem("" + localStorage_prefix + ".userAddress"));
        rs_form.find('.btn.connect').addClass('btn-success');
      } else {
        rs_form.find('.btn.connect').removeClass('btn-success');
      }
      if (authorized) {
        return rs_form.find('.btn.authorize').addClass('btn-success');
      } else {
        return rs_form.find('.btn.authorize').removeClass('btn-success');
      }
    };
    state_update_hook();
    connect_handler = function(ev) {
      var user_address;
      if (!connected) {
        user_address = rs_form.find('input[name="userAddress"]').val();
        storage.connect(user_address, function(error, storageInfo) {
          if (error) {
            connected = false;
          } else {
            localStorage.setItem("" + localStorage_prefix + ".userStorageInfo", JSON.stringify(storageInfo));
            localStorage.setItem("" + localStorage_prefix + ".userAddress", user_address);
            connected = true;
          }
          return state_update_hook();
        });
      } else {
        localStorage.removeItem("" + localStorage_prefix + ".userStorageInfo");
        localStorage.removeItem("" + localStorage_prefix + ".bearerToken");
        connected = authorized = false;
        state_update_hook();
        connect_handler(ev);
      }
      return false;
    };
    rs_form.find('.connect').on('click', connect_handler);
    return rs_form.find('.authorize').on('click', function() {
      if (!authorized) {
        storage.authorize(null, function() {
          authorized = true;
          return state_update_hook();
        });
      } else {
        localStorage.removeItem("" + localStorage_prefix + ".bearerToken");
        authorized = false;
        state_update_hook();
      }
      return false;
    });
  });

}).call(this);