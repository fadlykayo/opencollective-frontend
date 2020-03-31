import React from 'react';
import PropTypes from 'prop-types';
import { useIntl, defineMessages } from 'react-intl';
import { Box } from '@rebass/grid';
import { get, pick } from 'lodash';
import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { Formik, Field, Form } from 'formik';

import { getErrorFromGraphqlException } from '../lib/errors';
import { CollectiveType } from '../lib/constants/collectives';
import roles from '../lib/constants/roles';
import { isValidEmail } from '../lib/utils';
import { H5 } from './Text';
import StyledInputField from './StyledInputField';
import StyledInput from './StyledInput';
import Container from './Container';
import StyledButton from './StyledButton';
import MessageBox from './MessageBox';

const CreateNewMessages = defineMessages({
  [CollectiveType.COLLECTIVE]: {
    id: 'Collective.CreateNew',
    defaultMessage: 'Create new Collective',
  },
  [CollectiveType.USER]: {
    id: 'User.InviteNew',
    defaultMessage: 'Invite new user',
  },
  [CollectiveType.EVENT]: {
    id: 'Event.CreateNew',
    defaultMessage: 'Create new event',
  },
  [CollectiveType.ORGANIZATION]: {
    id: 'Organization.CreateNew',
    defaultMessage: 'Create new Organization',
  },
});

const msg = defineMessages({
  emailTitle: {
    id: 'EditUserEmailForm.title',
    defaultMessage: 'Email address',
  },
  adminEmail: {
    id: 'NewOrganization.Admin.Email',
    defaultMessage: 'Admin email address',
  },
  adminName: {
    id: 'NewOrganization.Admin.Name',
    defaultMessage: 'Admin name',
  },
  name: {
    id: 'Fields.name',
    defaultMessage: 'Name',
  },
  organizationName: {
    id: 'Organization.Name',
    defaultMessage: 'Organization name',
  },
  fullName: {
    id: 'User.FullName',
    defaultMessage: 'Full name',
  },
  website: {
    id: 'Fields.website',
    defaultMessage: 'Website',
  },
  cancel: {
    id: 'actions.cancel',
    defaultMessage: 'Cancel',
  },
  save: {
    id: 'save',
    defaultMessage: 'Save',
  },
  invalidEmail: {
    id: 'error.email.invalid',
    defaultMessage: 'Invalid email address',
  },
  invalidWebsite: {
    id: 'error.website.invalid',
    defaultMessage: 'Invalid website address',
  },
  invalidName: {
    id: 'error.name.invalid',
    defaultMessage: 'Name is required',
  },
});

/** Prepare mutation variables based on collective type */
const prepareMutationVariables = collective => {
  if (collective.type === CollectiveType.USER) {
    return { user: pick(collective, ['name', 'email']) };
  } else if (collective.type === CollectiveType.ORGANIZATION) {
    collective.members.forEach(member => (member.role = roles.ADMIN));
    return { collective: pick(collective, ['name', 'type', 'website', 'members']) };
  } else {
    return { collective: pick(collective, ['name', 'type', 'website']) };
  }
};

const CreateCollectiveMutation = gql`
  mutation CreateCollective($collective: CollectiveInputType!) {
    createCollective(collective: $collective) {
      id
      name
      slug
      type
      imageUrl(height: 64)
    }
  }
`;

const CreateUserMutation = gql`
  mutation CreateUser($user: UserInputType!) {
    createUser(user: $user, throwIfExists: false, sendSignInLink: false) {
      user {
        id
        collective {
          id
          name
          slug
          type
          imageUrl(height: 64)
          ... on User {
            email
          }
        }
      }
    }
  }
`;

/**
 * A mini-form to create collectives/orgs/users. Meant to be embed in popups or
 * small component where we want to provide just the essential fields.
 */
const CreateCollectiveMiniForm = ({ type, onCancel, onSuccess }) => {
  const isUser = type === CollectiveType.USER;
  const isCollective = type === CollectiveType.COLLECTIVE;
  const isOrganization = type === CollectiveType.ORGANIZATION;
  const mutation = isUser ? CreateUserMutation : CreateCollectiveMutation;
  const [createCollective, { error: submitError }] = useMutation(mutation);
  const { formatMessage } = useIntl();

  const initialValues = {
    members: [{ member: { email: '', name: '' } }],
    email: '',
    name: '',
    website: '',
  };

  const validate = values => {
    const errors = {};

    if (isOrganization) {
      if (!get(values, 'members[0].member.email') || !isValidEmail(get(values, 'members[0].member.email'))) {
        errors.members = [{ member: { email: formatMessage(msg.invalidEmail) } }];
      }
      if (!get(values, 'members[0].member.name')) {
        errors.members
          ? (errors.members[0].member.name = formatMessage(msg.invalidName))
          : [{ member: { name: formatMessage(msg.invalidName) } }];
      }
    } else {
      if (!values.email || !isValidEmail(values.email)) {
        errors.email = formatMessage(msg.invalidEmail);
      }
    }
    if (!values.name) {
      errors.name = formatMessage(msg.invalidName);
    }

    return errors;
  };

  const submit = formValues => {
    createCollective({ variables: prepareMutationVariables({ ...formValues, type }) }).then(({ data }) => {
      return onSuccess(isUser ? data.createUser.user.collective : data.createCollective);
    });
  };

  return (
    <Formik validate={validate} initialValues={initialValues} onSubmit={submit} validateOnChange={true}>
      {formik => {
        const { values, handleSubmit, errors, touched, isSubmitting } = formik;

        return (
          <Form>
            <H5 fontWeight={600}>{CreateNewMessages[type] ? formatMessage(CreateNewMessages[type]) : null}</H5>
            <Box mt={3}>
              {(isUser || isOrganization) && (
                <StyledInputField
                  name={isOrganization ? 'members[0].member.email' : 'email'}
                  htmlFor={isOrganization ? 'members[0].member.email' : 'email'}
                  label={formatMessage(isOrganization ? msg.adminEmail : msg.emailTitle)}
                  error={
                    isOrganization
                      ? get(touched, 'members[0].member.email') && get(errors, 'members[0].member.email')
                      : touched.email && errors.email
                  }
                  mt={3}
                  value={isOrganization ? get(values, 'members[0].member.email') : values.email}
                >
                  {inputProps => (
                    <Field
                      as={StyledInput}
                      {...inputProps}
                      type="email"
                      width="100%"
                      placeholder="i.e. john-smith@youremail.com"
                    />
                  )}
                </StyledInputField>
              )}
              {isOrganization && (
                <StyledInputField
                  autoFocus
                  name="members[0].member.name"
                  htmlFor="members[0].member.name"
                  label={formatMessage(msg.adminName)}
                  error={get(touched, 'members[0].member.name') && get(errors, 'members[0].member.name')}
                  mt={3}
                  value={get(values, 'members[0].member.name')}
                >
                  {inputProps => (
                    <Field as={StyledInput} {...inputProps} width="100%" placeholder="i.e. John Doe, Frank Zappa" />
                  )}
                </StyledInputField>
              )}
              <StyledInputField
                autoFocus
                name="name"
                htmlFor="name"
                label={formatMessage(isUser ? msg.fullName : isOrganization ? msg.organizationName : msg.name)}
                error={touched.name && errors.name}
                mt={3}
                value={values.name}
              >
                {inputProps => (
                  <Field
                    as={StyledInput}
                    {...inputProps}
                    width="100%"
                    placeholder={
                      isUser
                        ? 'i.e. John Doe, Frank Zappa'
                        : isCollective
                        ? 'i.e. Webpack, Babel'
                        : 'i.e. AirBnb, TripleByte'
                    }
                  />
                )}
              </StyledInputField>
              {!isUser && (
                <StyledInputField
                  name="website"
                  htmlFor="website"
                  label={formatMessage(msg.website)}
                  error={errors.website}
                  mt={3}
                  value={values.website}
                >
                  {inputProps => (
                    <Field as={StyledInput} {...inputProps} placeholder="i.e. opencollective.com" width="100%" />
                  )}
                </StyledInputField>
              )}
            </Box>
            {submitError && (
              <MessageBox type="error" withIcon mt={2}>
                {getErrorFromGraphqlException(submitError).message}
              </MessageBox>
            )}
            <Container
              display="flex"
              flexWrap="wrap"
              justifyContent="flex-end"
              borderTop="1px solid #D7DBE0"
              mt={4}
              pt={3}
            >
              <StyledButton mr={2} minWidth={100} onClick={() => onCancel()} disabled={isSubmitting}>
                {formatMessage(msg.cancel)}
              </StyledButton>
              <StyledButton
                type="submit"
                buttonStyle="primary"
                minWidth={100}
                loading={isSubmitting}
                onSubmit={handleSubmit}
              >
                {formatMessage(msg.save)}
              </StyledButton>
            </Container>
          </Form>
        );
      }}
    </Formik>
  );
};

CreateCollectiveMiniForm.propTypes = {
  /** The collective type to create */
  type: PropTypes.oneOf(Object.values(CollectiveType)).isRequired,
  /** Called when cancel is clicked */
  onCancel: PropTypes.func.isRequired,
  /** Called with the collective created when the function succeed */
  onSuccess: PropTypes.func.isRequired,
};

export default CreateCollectiveMiniForm;
