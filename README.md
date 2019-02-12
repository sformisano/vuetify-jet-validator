# VuetifyJetValidator - Validate Vuetify Forms Like a Champ!

VuetifyJetValidator is a simple helper class that simplifies dealing with form fields validations if you're using the
Vuetify library.

## Requirements

* Your project must be built with Vue.js
* The class is only tested with Vuetify and its standard form validation. While you may be able to use it to abstract
other validation libraries with a similar api, that is not a supported use case.

## Instructions

1. Install the library: `npm install --save vuetify-jet-validator`

2. In your component's reactive data object, create a validator instance and return it as a data property:
```javascript
data() {
  const validator = new VuetifyJetValidator();

  return {
    validator
  }
}

```
3. Create a validation rules object with properties for each field:
```javascript
data() {
  const validator = new VuetifyJetValidator();

  // This is an example for a typical signup form.
  return {
    // I like keeping field value properties within their own fields object to keep things tidy.
    fields: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: ""
    },
    // These are the rules that will be hooked to fields in the form template.
    rules: {
      /*
       * Each property here is an array of rules. Each rule function takes at least one argument,
       * which is the message to display if the validation fails (for some rules it's optional
       * as they have a default fallback message, for others it's required).
       * A simple explanation of each method is available in the source code.
       */
      firstName: [validator.rules.required("First name is required.")],
      lastName: [validator.rules.required("Last name is required.")],
      email: [
        validator.rules.required("E-mail is required."),
        validator.rules.email("Invalid email."),
        validator.rules.api("email-taken", "This email address is already in use by another account."),
      ],
      password: [
        validator.rules.required("Password is required."),
        validator.rules.minLength(6, "Password should be at least 6 characters."),
        validator.rules.maxLength(72, "Password should not exceed 72 characters.")
      ],
      confirmPassword: [
        validator.rules.matches(that.fields, "password", "Passwords must match.")
      ]
    }
  }
}
```

4. Add the validation rules to the vuetify fields:

```javascript
<v-form @submit.prevent="submitSignUpForm" ref="signupForm">
  <v-layout row>
    <v-flex xs12>
      <v-text-field
          name="firstName"
          label="First Name"
          id="firstName"
          v-model="fields.firstName"
          type="text"
          :rules="rules.firstName"
      ></v-text-field>
    </v-flex>
  </v-layout>
  <v-layout row>
    <v-flex xs12>
      <v-text-field
          name="lastName"
          label="Last Name"
          id="lastName"
          v-model="fields.lastName"
          type="text"
          :rules="rules.lastName"
      ></v-text-field>
    </v-flex>
  </v-layout>
  <v-layout row>
    <v-flex xs12>
      <v-text-field
          name="email"
          label="Email"
          id="email"
          v-model="fields.email"
          type="email"
          :rules="rules.email"
      ></v-text-field>
    </v-flex>
  </v-layout>
  <v-layout row>
    <v-flex xs12>
      <v-text-field
        name="password"
        type="password"
        label="Password"
        id="password"
        v-model="fields.password"
        :rules="rules.password"
      ></v-text-field>
    </v-flex>
  </v-layout>
  <v-layout row>
    <v-flex xs12>
      <v-text-field
        name="confirmPassword"
        label="Confirm Password"
        id="confirmPassword"
        v-model="fields.confirmPassword"
        :rules="rules.confirmPassword"
      ></v-text-field>
    </v-flex>
  </v-layout>
</v-form>
```

5. In your form submission method, follow the pattern exemplified here:
```javascript
async submitSignUpForm() {
  // 1. Validate the form before the submission and return if the form is not valid.
  // Errors will be automatically displayed next to each field with errors.
  if (!this.validator.formIsValid(this.$refs.signupForm)) {
    return false;
  }

  // 2. If the form is valid submit your async request (this example uses vuex but it's not a requirement)
  try {
    await this.$store.dispatch("your-signup-action", {
      firstName: this.fields.firstName,
      lastName: this.fields.lastName,
      email: this.fields.email,
      password: this.fields.password
    });
    this.formIsLoading = false;
    
    // Do whatever you need to do after a successful signup
    // (e.g. show a success message, redirect somewhere, send welcome email etc.)
  } catch (err) {
    // The request failed, pass whatever error code was sent back from your api to the validator.
    // More on this is explained in the api rule description below.
    this.validator.setRequestApiError(err.code);
    this.formIsLoading = false;
  }
}
```

That's it! Your form will now display errors on each field with errors, and it will also tie api errors
to the appropriate field that triggered them.

## The .api method

While other methods are pretty straightforward, One of the things you will likely need is a way to account for errors coming from the api that have to do
with a specific field. The simplest example is the "email taken" error: while you can make sure a valid email is
being sent to your api, you can't know whether an account already exists for that email or not until you submit it.

This method allows you to resolve this problem in three simple steps:

1. Have your api endpoint return an error code for the error you want to tie to a field, e.g. "email-taken".
2. Add the .api() rule just like you've seen in the signup form example, with the error code triggered by the email.
3. Make sure your form submission method uses the `setRequestApiError` just as shown in the example above.

These three simple steps will make sure the email taken error shows up next to the email field.

## On error messages

The reason this class encourages you to inline error messages in your validations rather than just providing messages
in the library itself is that this encourages better error messages and allows you to deal with things like i18n outside
of this class (since i18n is well out of scope for this class).

# Future TODOs

* A standard way to deal with unrecognised or request wide api errors (i.e. errors that should not be displayed next to
a field but rather above the form as flash message).

