var builder = require("botbuilder");
var soapReq = require("./soapFunctions");
var util = require('util');

var AvailableLanguages = {
    English: "English",
    Espanol: "Español"
};

var botFunctions = {};
var botResults = {};

botFunctions.InitBot = function(connector) {
    
    //Configure bot default Locale as Spanish
    var bot = new builder.UniversalBot(connector, {
        localizerSettings: { 
            defaultLocale: "es",
            botLocalePath: "./locale" 
        }
    });

    //Main dialog
    bot.dialog("/", [
        //Locale picker
        function (session) {
            session.beginDialog('/localePicker');
        },
        //Specific data dialog
        function (session) {
            session.send("greeting");
            session.beginDialog("/userData");
        },
        //Show results on dialog
        function(session) {
            session.beginDialog("/showResults");
        }
    ]);

    //Locale picker dialog
    bot.dialog('/localePicker', [
        function (session) {
            // prompt for search option
            builder.Prompts.choice(
                session,
                "lang_choice_prompt",
                [AvailableLanguages.English, AvailableLanguages.Espanol],
                {
                    listStyle: builder.ListStyle.button,
                    maxRetries: 3,
                    retryPrompt: "Not a valid option"
                });
        },
        function (session, results) {
            // Update preferred locale
            var locale;
            switch (results.response.entity) {
                case "English":
                    locale = 'en';
                    break;
                case "Español":
                    locale = 'es';
                    break;
            }
            session.preferredLocale(locale, function (err) {
                if (!err) {
                    session.send("lang_preferred_language", results.response.entity);
                    // Locale files loaded
                    session.endDialog();
                } else {
                    // Problem loading the selected locale
                    session.error(err);
                }
            });
        }
    ]);

    //userData dialog
    bot.dialog('/userData', [
        function (session) {
            session.dialogData.userData = {};
            session.dialogData.titleData = {};
            session.dialogData.titleUserData = {};
            session.dialogData = botFunctions.PrepareDialogTitles(session);
            //Prompt for id number
            builder.Prompts.text(session, session.dialogData.titleData.idNumber);
        },
        function (session, results) {
            //Store Id. Number and prompt for type income
            session.dialogData.userData.idNumber = results.response;
            builder.Prompts.text(session, session.dialogData.titleData.password);
        },
        function (session, results) {
            var resultData = [];
            //Store income amount. 
            session.dialogData.userData.password = results.response;

            //Display session data
            for (var key in session.dialogData.userData) {
                if (session.dialogData.userData.hasOwnProperty(key))
                    resultData.push(session.dialogData.titleUserData[key] + ": " + session.dialogData.userData[key]);
            }

            var card = new builder.HeroCard(session)
                .title('User information')
                .text(resultData.join(" | "));

            var msg = new builder.Message(session).addAttachment(card);
                session.send(msg);

            //builder.Prompts.confirm(session, "user_data_verification");
            builder.Prompts.choice(
                session,
                "user_data_verification",
                [session.localizer.gettext(session.preferredLocale(), "system_yes"),
                 session.localizer.gettext(session.preferredLocale(), "system_no")],
                {
                    listStyle: builder.ListStyle.button,
                    maxRetries: 3,
                    retryPrompt: "Not a valid option"
                });
        },
        function (session, results) {
            session.send("results.response.entity = " + results.response.entity);
            if (results.response.entity == session.localizer.gettext(session.preferredLocale(), "system_yes")){
                session.beginDialog('/showResults',{ userData: session.dialogData.userData });
                session.endDialog();
            }
            else {
                session.endDialog("system_retry");
                session.beginDialog('/userData');
            }
        }
    ]);

    //Locale picker dialog
    bot.dialog('/showResults', [
        function (session, args) {
            session.beginDialog("/systemReset");
        }
    ]);
    
    //Main dialog
    bot.dialog("/systemReset", [
        //Locale picker
        function (session) {
            builder.Prompts.confirm(session, "system_reset");
        },
        //Specific data dialog
        function (session, results) {
            if (results.response) {
                session.beginDialog("/userData");
                session.endDialog();
            }
            else {
                session.endConversation("system_end");
            }
        }
    ]);
}

botFunctions.PrepareDialogTitles = function(session) {
    var dialogData = session.dialogData;
    
    dialogData.titleUserData = {
        idNumber: session.localizer.gettext(session.preferredLocale(), "user_data_id_number"),
        password: session.localizer.gettext(session.preferredLocale(), "user_data_password")
    };

    //Generate titleData
    dialogData.titleData = {};
    for (var key in dialogData.titleUserData) {
        if (dialogData.titleUserData.hasOwnProperty(key))
            dialogData.titleData[key] = session.localizer.gettext(session.preferredLocale(), "user_data_request_base") + dialogData.titleUserData[key];
    }

    return dialogData;
};

botFunctions.SearchInObject = function(object, text) {
    var results = [];
    for (var key in object) {
        if (object.hasOwnProperty(key) && key.includes(text)){
            results.push(object[key]);
        }
        else if (object.hasOwnProperty(key) && typeof(object[key]) == "object" && botFunctions.VerifyObject(object[key])) {
            var internalResults = botFunctions.SearchInObject(object[key], text);
            if (internalResults && internalResults.length) {
                results.push.apply(results, internalResults);
            }
        }
    }

    return results;
};

botFunctions.VerifyObject = function(object) {
    if (object) {
        var propCount = 0;
        for (var key in object) {
            if (object.hasOwnProperty(key)){
                propCount++;
            }
        }

        if (propCount > 0) {
            return true;
        }
    }
    return false;
};

module.exports = {
  functions: botFunctions
};