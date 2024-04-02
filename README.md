# lambda-openapi-validator

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![Apache 2.0 License][license-image]][license-url]

This package provides data validation within a Lambda function according to a [Swagger/OpenAPI definition](https://swagger.io/specification/). It uses [Ajv](https://www.npmjs.com/package/ajv) under the hood for validation.

**Table of Contents**

- [lambda-openapi-validator](#lambda-openapi-validator)
  - [Installation](#installation)
  - [API](#api)
    - [lambda-openapi-validator.init(openapiSchema, options)](#lambda-openapi-validatorinitopenapischema-options)
      - [Options](#options)
  - [Important Notes](#important-notes)
    - [Schema Objects](#schema-objects)
  - [Known Issues with OpenAPI 3](#known-issues-with-openapi-3)
  - [Running Tests](#running-tests)

## Installation

Install using the node package registry:

```bash
npm install --save lambda-openapi-validator
```

Then import the module in your code:

```js
const Validator = require('lambda-openapi-validator')
```

## API

### lambda-openapi-validator.init(openapiSchema, options)

Initialize using a swagger definition.
The function executes synchronously and does not return anything.

- `openapiSchema`: The OpenAPI definition.
- `options`: Additional options ([see below](#options)).

#### Options

Options currently supported:

- `formats` - Array of formats that can be added to `ajv` configuration, each element in the array should include `name` and `pattern`.

  ```js
  formats: [
    { name: 'double', pattern: /\d+\.(\d+)+/ },
    { name: 'int64', pattern: /^\d{1,19}$/ },
    { name: 'int32', pattern: /^\d{1,10}$/ },
  ]
  ```

- `keywords` - Array of keywords that can be added to `ajv` configuration, each element in the array can be either an object or a function.
  If the element is an object, it must include `name` and `definition`. If the element is a function, it should accept `ajv` as its first argument and inside the function you need to call `ajv.addKeyword` to add your custom keyword
- `beautifyErrors`- Boolean that indicates if to beautify the errors, in this case it will create a string from the Ajv error.

  - Examples:
    - `query/limit should be <= 100` - query param
    - `path/petId should NOT be shorter than 3 characters` - path param not in format
    - `body/[0].test.field1 should be string` - Item in an array body
    - `body/test should have required property 'field1'` - nested field
    - `body should have required property 'name'` - Missing field in body

  You can see more examples in the [tests](./test).

- `firstError` - Boolean that indicates if to return only the first error.
- `makeOptionalAttributesNullable` - Boolean that forces preprocessing of Swagger schema to include 'null' as possible type for all non-required properties. Main use-case for this is to ensure correct handling of null values when Ajv type coercion is enabled
- `ajvConfigBody` - Object that will be passed as config to new Ajv instance which will be used for validating request body. Can be useful to e. g. enable type coercion (to automatically convert strings to numbers etc). See Ajv documentation for supported values.
- `ajvConfigParams` - Object that will be passed as config to new Ajv instance which will be used for validating request body. See Ajv documentation for supported values.
- `contentTypeValidation` - Boolean that indicates if to perform content type validation in case `consume` field is specified and the request body is not empty.
- `expectFormFieldsInBody` - Boolean that indicates whether form fields of non-file type that are specified in the schema should be validated against request body (e. g. Multer is copying text form fields to body)
- `errorFormatter` - optional custom function that will be invoked to create a validation error that will be thrown if Ajv validation fails. Function should accept two parameters: `(errors, options)` and return an error that will be thrown.

## Important Notes

### Schema Objects

It is important to set the `type` property of any [Schema Objects](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#schema-object) explicitly to `object`. Although it isn't required in the OpenAPI specification, it is necessary in order for [Ajv](https://www.npmjs.com/package/ajv) to work correctly.

## Known Issues with OpenAPI 3

- Inheritance with a discriminator is supported only if the ancestor object is the discriminator.
- The discriminator support in the inheritance chain stops when getting to a child without a discriminator (a leaf in the inheritance tree), meaning a child without a discriminator cannot point to another child with a discriminator.

## Running Tests

The tests use mocha, istanbul and mochawesome. Run them using the node test script:

```bash
npm test
```

[npm-image]: https://img.shields.io/npm/v/lambda-openapi-validator.svg?style=flat
[npm-url]: https://npmjs.org/package/lambda-openapi-validator
[downloads-image]: http://img.shields.io/npm/dm/lambda-openapi-validator.svg?style=flat
[downloads-url]: https://img.shields.io/npm/dm/lambda-openapi-validator.svg
[license-image]: https://img.shields.io/badge/license-Apache_2.0-green.svg?style=flat
[license-url]: LICENSE
[snyk-image]: https://snyk.io/test/github/srax47/lambda-openapi-validator/badge.svg?targetFile=package.json
[snyk-url]: https://snyk.io/test/github/srax47/lambda-openapi-validator?targetFile=package.json
