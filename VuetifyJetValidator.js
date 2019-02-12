/**
 * VuetifyJetValidator is a helper class
 * Instructions for usage in components:
 *
 * 1. In reactive data() create new object:
 * const jetValidator = new VuetifyJetValidator()
 *
 * 2. Define a rules object for your fields inside data(), each with an array of validators:
 * const rules: {
 *   myField: [jetValidator.rules.api(), jetValidator.otherRule()],
 *   otherField: [jetValidator.rules.api()]
 * }
 *
 * NOTE: look at how each validation method works, some of them require parameters.
 *
 * 3. In form submission methods, validate the form by passing it to jetValidator before
 * trying to make the http request to create/update resources:
 * jetValidator.isValidForm(yourFormReference)
 *
 * 4. Step 2 will have validated the form and it will have also tied it to that validator
 * instance, so if the api returns errors, you can add those errors directly to the fields
 * like this:
 * jetValidator.setRequestApiErrors(yourErrors)
 *
 * 5. This validator can also retrieve api errors non tied directly to a single field,
 * they are in the 'global' property of the api errors object. Forms should display these
 * somewhere.
 */

/**
 * The constructor function for the validator.
 *
 * @constructor
 */
export default function VuetifyJetValidator() {
  this.form = null;
  this.apiErrors = [];
  // passing reference to VuetifyJetValidator object in rules object (used by the rules.api method)
  this.rules.__VALIDATOR_OBJECT = this;
}

/**
 * The rules object with all the functions used to validate fields.
 *
 * @type {
 *   {
 *      api(string, string): function(*): (boolean|string),
 *      email(string): function(*): (boolean|string),
 *      maxLength(number, string): function(*): (boolean|string),
 *      matches(Object, string, string): function(*): (boolean|string),
 *      minLength(number, string): function(*): (boolean|string),
 *      phone(string): function(*): (boolean|string),
 *      required(*=): function(*=): boolean,
 *      username(*=): function(*=): boolean
 *   }
 * }
 */
VuetifyJetValidator.prototype.rules = {
  /**
   * Tells the validator that api could send errors with the error code passed as arguments.
   * So if, for example, the front-end has an email field and the api sends an error with code "auth/invalid-email",
   * we could pull those api errors like this inside the validator rules object:
   *
   * validatorRules: {
   *  email: [validator.rules.api("auth/invalid-email", "Invalid email")]
   * }
   *
   * This will make sure that any validation errors caused by the email value will come back attached to the front-end
   * 'email' field. An example could be a 'unique' error, i.e. 'email must be unique'.
   *
   * @param {string} errorCode
   * @param {string} message
   * @returns {function(*): (boolean|string)}
   */
  api(errorCode, message) {
    return () => {
      if (this.__VALIDATOR_OBJECT.apiErrors.indexOf(errorCode) !== -1) {
        return message;
      }

      return true;
    };
  },

  /**
   * The returned function makes sure the passed value is a valid email address.
   * Returns the error message otherwise.
   *
   * @param {string} message
   * @returns {function(*): (boolean|string)}
   */
  email(message) {
    if (!message) {
      message = "Invalid email address format.";
    }

    // max 24 chars after last dot as modern new TLDs can be very long
    // https://stackoverflow.com/questions/9238640/how-long-can-a-tld-possibly-be
    return v => {
      return /^\w+([.\-+]?\w+)*\+*@\w+([.-]?\w+)*(\.\w{2,24})+$/.test(v) || message;
    };
  },

  /**
   * The returned function makes sure the passed value is a valid phone number.
   * Returns the error message otherwise.
   *
   * @param {string} message
   * @returns {function(*): (boolean|string)}
   */
  phone(message) {
    if (!message) {
      message = "Invalid phone number format";
    }

    return v => {
      return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(v) || message;
    };
  },

  /**
   * The returned function makes sure the passed property value matches the field value.
   * Returns the error message otherwise.
   *
   * Note: we're using an object (i.e. the vue component) and its property name
   * (the model tied to the field value) because the value is not available
   * when the wrapping "matches" function is invoked, but it will be available
   * when the inner callback is triggered for the validation, so we reference
   * its location without passing the value at definition time.
   *
   * @param {object} object
   * @param {string} propertyName
   * @param {string} message
   * @returns {function(*): (boolean|string)}
   */
  matches(object, propertyName, message) {
    return v => {
      const compare = object[propertyName];
      return compare === v || message;
    };
  },

  /**
   * Validator that ensures the value in a field doesn't exceed a predefined length limit.
   * Returns the error message otherwise.
   *
   * @param {number} length The maximum length allowed for the field's value
   * @param {string} message
   * @returns {function(*): (boolean|string)}
   */
  maxLength(length, message) {
    if (!message) {
      message = `Max ${length} characters allowed.`;
    }

    return v => {
      return v && v.length > length ? message : true;
    };
  },

  /**
   * Validator that ensures the value in a field doesn't go below a predefined length limit.
   * Returns the error message otherwise.
   *
   * @param {number} length The minimum length allowed for the field's value
   * @param {string} message
   * @returns {function(*): (boolean|string)}
   */
  minLength(length, message) {
    if (!message) {
      message = `Min ${length} characters allowed.`;
    }

    return v => {
      return v && v.length < length ? message : true;
    };
  },

  /**
   * Validator that ensures the field value is not empty.
   * Returns the error message otherwise.
   *
   * @param message
   * @returns {function(*=): boolean}
   */
  required (message) {
    if (!message) {
      message = "This field is required.";
    }

    return v => {
      return !v || (v.length && v.length < 1) ? message : true;
    };
  },

  /**
   * Ensures the username is only composed of alpha-numeric characters and underscores.
   * Returns the error message otherwise.
   *
   * @param message
   * @returns {function(*=): boolean}
   */
  username(message) {
    if (!message) {
      message = "Only letters, numbers and underscore are allowed.";
    }

    return v => {
      return /^[a-zA-Z0-9_]+$/.test(v) ? true : message;
    };
  }
};

/**
 * Used when an api request returns an error to display the error.
 *
 * @param {string} errorCode
 */
VuetifyJetValidator.prototype.setRequestApiError = function(errorCode) {
  // this should be called after a new http request, so reset previous api errors
  this.apiErrors = [errorCode];
  this.form.validate();

  // validate() displayed the errors, the errors object now needs to be emptied
  // because when user goes to change invalid values these errors are no longer
  // applicable (a new api call is required to see if the new value triggers
  // errors or not).
  this.apiErrors = [];
};

/**
 * Triggers the vuetify form validate function and returns its result.
 *
 * @param form
 * @returns {*}
 */
VuetifyJetValidator.prototype.formIsValid = function(form) {
  this.form = form;
  return form.validate();
};