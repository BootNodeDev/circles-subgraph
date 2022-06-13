import {
  BigInt,
  Address,
  store,
} from '@graphprotocol/graph-ts'
import {
  GroupCurrencyTokenCreated as GroupCurrencyTokenCreatedEvent
} from './types/GroupCurrencyTokenFactory/GroupCurrencyTokenFactory'
import {
  GroupCurrencyToken as GroupCurrencyTokenContract, MemberTokenAdded as MemberTokenAddedEvent
} from './types/GroupCurrencyTokenFactory/GroupCurrencyToken'
import { GroupCurrencyToken, SafeGroupMember } from './types/schema'
import { GroupCurrencyToken as GroupCurrencyTokenTemplate } from './types/templates'

export function createGroupCurrencyTokenIfNonExistent(groupAddress: Address): GroupCurrencyToken {
  let groupAddressString = groupAddress.toHexString()
  let groupCurrencyToken = GroupCurrencyToken.load(groupAddressString)

  if (!groupCurrencyToken) {
    // Load Group State from the Contract
    let GroupCurrencyTokenContractInstance = GroupCurrencyTokenContract.bind(groupAddress)
    groupCurrencyToken = new GroupCurrencyToken(groupAddressString)
    groupCurrencyToken.name = GroupCurrencyTokenContractInstance.name()
    groupCurrencyToken.symbol = GroupCurrencyTokenContractInstance.symbol()
    groupCurrencyToken.hub = GroupCurrencyTokenContractInstance.hub().toHexString()
    groupCurrencyToken.owner = GroupCurrencyTokenContractInstance.owner().toHexString()
    groupCurrencyToken.treasury = GroupCurrencyTokenContractInstance.treasury().toHexString()
    groupCurrencyToken.mintFeePerThousand = BigInt.fromI32(GroupCurrencyTokenContractInstance.mintFeePerThousand())
    groupCurrencyToken.suspended = GroupCurrencyTokenContractInstance.suspended()
    groupCurrencyToken.onlyOwnerCanMint = GroupCurrencyTokenContractInstance.onlyOwnerCanMint()
    groupCurrencyToken.onlyTrustedCanMint = GroupCurrencyTokenContractInstance.onlyTrustedCanMint()
    groupCurrencyToken.save()
    // Finally creates the Data Template
    GroupCurrencyTokenTemplate.create(groupAddress)
  }
  return groupCurrencyToken
}

export function createSafeGroupMemberId(groupId: string, safeId: string): string {
  return groupId + "-" + safeId
}

export function createSafeGroupMemberIfNonExistent(groupId: string, safeId: string): SafeGroupMember {
  let id = createSafeGroupMemberId(groupId, safeId)
  let safeGroupMember = SafeGroupMember.load(id)
  if (!safeGroupMember) {
    safeGroupMember = new SafeGroupMember(id)
    safeGroupMember.group = groupId
    safeGroupMember.safe = safeId
    safeGroupMember.save()
  }
  return safeGroupMember
}

export function handleGroupCurrencyTokenCreation(event: GroupCurrencyTokenCreatedEvent): void {
  let groupAddress = event.params._address
  let creator = event.params._deployer.toHexString()
  let groupCurrencyToken = createGroupCurrencyTokenIfNonExistent(groupAddress)
  groupCurrencyToken.creator = creator
  groupCurrencyToken.save()
}

export function handleMemberTokenAdded(event: MemberTokenAddedEvent): void {
  // group Id is generated by transforming the group Address to HexString
  let groupId = event.address.toHexString()
  // safe Id is generated by transforming the Safe Address to Hex
  let safeId = event.params._memberToken.toHex()
  createSafeGroupMemberIfNonExistent(groupId, safeId)
}

// @TODO shall we remove them or we might want to keep them for historical data?
// Currently we are removing them from the group
export function handleMemberTokenRemoved(event: MemberTokenAddedEvent): void {
  // group Id is generated by transforming the group Address to HexString
  let groupId = event.address.toHexString()
  // safe Id is generated by transforming the Safe Address to Hex
  let safeId = event.params._memberToken.toHex()
  let groupMemberId = createSafeGroupMemberId(groupId, safeId)
  store.remove('SafeGroupMember', groupMemberId)
}
