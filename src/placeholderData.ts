import type { EIP } from './types/eip';
import type { Chamber, Comment } from './types/chamber';
import { EIP_STATUS, EIP_CATEGORY } from './constants/eip';

export const placeholderEIPs: EIP[] = [
  {
    id: 1,
    title: 'EIP-1: Ethereum Improvement Proposal 1',
    status: EIP_STATUS.DRAFT,
    category: EIP_CATEGORY.CORE,
    author: 'Vitalik Buterin',
    createdAt: new Date('2015-11-20T10:00:00Z'),
    updatedAt: new Date('2015-12-01T15:00:00Z'),
    requires: null,
    chamberId: 'chamber-1',
  },
  {
    id: 2,
    title: 'EIP-2: Another Core Proposal',
    status: EIP_STATUS.REVIEW,
    category: EIP_CATEGORY.CORE,
    author: 'Gavin Wood',
    createdAt: new Date('2016-01-10T12:00:00Z'),
    updatedAt: new Date('2016-01-20T18:00:00Z'),
    requires: [1],
    chamberId: 'chamber-2',
  },
  {
    id: 3,
    title: 'EIP-3: Networking Proposal',
    status: EIP_STATUS.LAST_CALL,
    category: EIP_CATEGORY.NETWORKING,
    author: 'Developer X',
    createdAt: new Date('2017-03-01T09:00:00Z'),
    updatedAt: new Date('2017-03-15T11:00:00Z'),
    requires: null,
    chamberId: 'chamber-3',
  },
  {
    id: 4,
    title: 'EIP-4: Interface Standard',
    status: EIP_STATUS.FINAL,
    category: EIP_CATEGORY.INTERFACE,
    author: 'Fabian Vogelsteller',
    createdAt: new Date('2018-05-05T14:00:00Z'),
    updatedAt: new Date('2018-05-25T16:00:00Z'),
    requires: null,
    chamberId: 'chamber-4',
  },
  {
    id: 5,
    title: 'EIP-5: ERC Token Standard',
    status: EIP_STATUS.LIVING,
    category: EIP_CATEGORY.ERC,
    author: 'Vitalik Buterin',
    createdAt: new Date('2017-11-28T17:00:00Z'),
    updatedAt: new Date('2019-01-01T10:00:00Z'),
    requires: null,
    chamberId: 'chamber-5',
  },
];

export const placeholderChambers: Chamber[] = [
  {
    id: 'chamber-1',
    eipId: 1,
    title: 'Chamber for EIP-1',
    description: 'Discussion and development chamber for EIP-1.',
    createdBy: 'admin',
    createdAt: Date.now() - 100000000,
  },
  {
    id: 'chamber-2',
    eipId: 2,
    title: 'Chamber for EIP-2',
    description: 'Discussion and development chamber for EIP-2.',
    createdBy: 'admin',
    createdAt: Date.now() - 90000000,
  },
  {
    id: 'chamber-3',
    eipId: 3,
    title: 'Chamber for EIP-3',
    description: 'Discussion and development chamber for EIP-3.',
    createdBy: 'admin',
    createdAt: Date.now() - 80000000,
  },
  {
    id: 'chamber-4',
    eipId: 4,
    title: 'Chamber for EIP-4',
    description: 'Read-only chamber for the final EIP-4.',
    createdBy: 'admin',
    createdAt: Date.now() - 70000000,
  },
  {
    id: 'chamber-5',
    eipId: 5,
    title: 'Chamber for EIP-5',
    description: 'Chamber for the living ERC standard EIP-5.',
    createdBy: 'admin',
    createdAt: Date.now() - 60000000,
  },
];

export const placeholderComments: Comment[] = [
  {
    id: 'comment-1',
    chamberId: 'chamber-1',
    text: 'This is a great proposal for EIP-1!',
    createdBy: 'UserA',
    createdAt: Date.now() - 5000000, // Timestamp as number
    parentId: null,
  },
  {
    id: 'reply-1-1',
    chamberId: 'chamber-1',
    text: 'I agree with UserA!',
    createdBy: 'UserB',
    createdAt: Date.now() - 4000000,
    parentId: 'comment-1', // Reply to comment-1
  },
  {
    id: 'comment-2',
    chamberId: 'chamber-1',
    text: 'I have some concerns about section 2 of EIP-1.',
    createdBy: 'UserC',
    createdAt: Date.now() - 3000000,
    parentId: null,
  },
  {
    id: 'comment-3',
    chamberId: 'chamber-2',
    text: 'Looking forward to the review of EIP-2.',
    createdBy: 'UserD',
    createdAt: Date.now() - 2000000,
    parentId: null,
  },
];
