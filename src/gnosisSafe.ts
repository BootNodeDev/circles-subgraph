import {
  store,
} from '@graphprotocol/graph-ts'

import {
  AddedOwner as AddedOwnerEvent,
  RemovedOwner as RemovedOwnerEvent,
} from './types/templates/GnosisSafe/GnosisSafe'

import {
  Safe,
  User,
} from './types/schema'

export function handleAddedOwner(event: AddedOwnerEvent): void {
  let user = new User(event.params.owner.toHexString())
  user.safe = event.address.toHexString()
  user.save()
}

export function handleRemovedOwner(event: RemovedOwnerEvent): void {  
  store.remove('User', event.params.owner.toHex())
}