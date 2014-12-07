define(["underscore", "jquery", "app"], function (_, $, app) {

    function getUIState(model) {

        function justNotNull(o) {
            var clone = {};
            for (var key in o) {
                if (o[key] != null)
                    clone[key] = o[key];
            }

            return clone;
        }

        var state = {};
        var json = model.toJSON();
        for (var key in json) {
            if (json[key] != null) {
                if (json[key].initData != null)
                    state[key] = justNotNull(json[key].toJSON());
                else
                    state[key] = json[key];
            }
        }

        state.content = state.content || " ";
        state.helpers = state.helpers || "";

        delete state._id;
        /* not sure about this, I need shortid for reports, so why it is here deleted */
        //delete state.shortid;
        return state;
    }

    function addInput(form, name, value) {
        var input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
    }

    var fn = function (model, beforeRenderListeners, target) {

        var uiState = getUIState(model);

        var request = { template: uiState, options: { preview: true} };

        beforeRenderListeners.fire(request, function (er) {
            if (er) {
                app.trigger("error", { responseText: er });
                return;
            }

            if (app.recipes[uiState.recipe] && app.recipes[uiState.recipe].render) {
                return app.recipes[uiState.recipe].render(request, target);
            }

            var mapForm = document.createElement("form");
            mapForm.target = target;
            mapForm.method = "POST";
            mapForm.action = app.serverUrl + "api/report?studio=" + app.options.studio;

            function addBody(path, body) {
                if (body == null)
                    return;

                if (body.initData != null)
                    body = body.initData;

                for (var key in body) {
                    if (_.isObject(body[key])) {
                        addBody(path + "[" + key + "]", body[key]);
                    } else {
                        addInput(mapForm, path + "[" + key + "]", body[key]);
                    }
                }
            }

            addBody("template", uiState);
            if (request.options != null)
                addBody("options", request.options);

            if (request.data != null)
                addInput(mapForm, "data", request.data);

            var headers = app.headers || {};
            headers["host-cookie"] = document.cookie;
            addBody("headers", headers);

            document.body.appendChild(mapForm);
            mapForm.submit();
            app.trigger("after-template-render");
        });
    };

    return fn;
});
