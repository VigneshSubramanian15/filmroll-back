import { userSignupSchema } from './schema/userSignup.js';
import { userVerifySchema } from './schema/userVerify.js';
import { userSetPasswordSchema } from './schema/userSetPassword.js';
import { userUpdateSchema } from './schema/userUpdate.js';
import { userUpdatePhoneNumberSchema } from './schema/userUpdatePhoneNumber.js';
import { userVerifyPhoneNumberSchema } from './schema/userVerifyPhoneNumber.js';
import { loginSchema } from './schema/login.js';
import { userAddNewUserSchema } from './schema/userAddNewUser.js';
import { userSelectStudioSchema } from './schema/userSelectStudio.js';
import { googleAuthSchema } from './schema/googleAuth.js';

import { userSignupHandler } from './function/userSignup.js';
import { userVerifyHandler } from './function/userVerify.js';
import { userSetPasswordHandler } from './function/userSetPassword.js';
import { userUpdateHandler } from './function/userUpdate.js';
import { userUpdatePhoneNumberHandler } from './function/userUpdatePhoneNumber.js';
import { userVerifyPhoneNumberHandler } from './function/userVerifyPhoneNumber.js';
import { loginHandler } from './function/login.js';
import { userAddNewUserHandler } from './function/userAddNewUser.js';
import { userSelectStudioHandler } from './function/userSelectStudio.js';
import { googleAuthHandler } from './function/googleAuth.js';

export default async function authRoutes(fastify) {
  fastify.post('/user-signup', {
    schema: userSignupSchema,
    handler: userSignupHandler,
  });

  fastify.post('/user-verify', {
    schema: userVerifySchema,
    handler: userVerifyHandler,
  });

  fastify.post('/user-set-password', {
    schema: userSetPasswordSchema,
    handler: userSetPasswordHandler,
  });

  fastify.patch('/user-update', {
    schema: userUpdateSchema,
    handler: userUpdateHandler,
  });

  fastify.patch('/user-update-phone-number', {
    schema: userUpdatePhoneNumberSchema,
    handler: userUpdatePhoneNumberHandler,
  });

  fastify.post('/user-verify-phone-number', {
    schema: userVerifyPhoneNumberSchema,
    handler: userVerifyPhoneNumberHandler,
  });

  fastify.post('/login', {
    schema: loginSchema,
    handler: loginHandler,
  });

  fastify.post('/user-add-new-user', {
    schema: userAddNewUserSchema,
    handler: userAddNewUserHandler,
  });

  fastify.post('/user-select-studio', {
    schema: userSelectStudioSchema,
    handler: userSelectStudioHandler,
  });

  fastify.post('/auth/google', {
    schema: googleAuthSchema,
    handler: googleAuthHandler,
  });
}
