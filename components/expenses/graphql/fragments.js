import { gqlV2 } from '../../../lib/graphql/helpers';
import { CommentFieldsFragment } from '../../conversations/graphql';

export const loggedInAccountExpensePayoutFieldsFragment = gqlV2`
  fragment loggedInAccountExpensePayoutFieldsFragment on Individual {
    id
    slug
    imageUrl
    type
    name
    payoutMethods {
      id
      type
      name
      data
    }
    adminMemberships: memberOf(role: ADMIN) {
      nodes {
        id
        account {
          id
          slug
          imageUrl
          type
          name
          location {
            address
            country
          }
          payoutMethods {
            id
            type
            name
            data
          }
        }
      }
    }
  }
`;

export const expensePageExpenseFieldsFragment = gqlV2`
  fragment expensePageExpenseFieldsFragment on Expense {
    id
    legacyId
    description
    currency
    type
    status
    privateMessage
    attachments {
      id
      incurredAt
      description
      amount
      url
    }
    payee {
      id
      slug
      name
      type
      location {
        address
        country
      }
      payoutMethods {
        id
        type
        name
        data
      }
    }
    createdByAccount {
      id
      slug
      name
      type
      imageUrl
    }
    account {
      id
      slug
      name
      type
      imageUrl
      description
      settings
      twitterHandle
      currency
      expensePolicy
      ... on Collective {
        id
        isApproved
        balance
        host {
          id
          name
          slug
          type
          expensePolicy
          location {
            address
            country
          }
        }
      }
      ... on Event {
        id
        isApproved
        balance
        host {
          id
          name
          slug
          type
          expensePolicy
          location {
            address
            country
          }
        }
      }
    }
    payoutMethod {
      id
      type
      data
    }
    comments {
      nodes {
        ...CommentFields
      }
    }
    permissions {
      canEdit
      canDelete
      canSeeInvoiceInfo
    }
  }

  ${CommentFieldsFragment}
`;
