import Layout from '@components/Layout'
import { PagePadding } from '@components/Layout/PagePadding'
import { PageTitle } from '@components/Layout/PageTitle'
// import { DelegationList } from '@twabRewards/DelegationList'
// import { DelegationTitle } from '@twabRewards/DelegationTitle'
import { useEffect } from 'react'
// import { UsersDelegationState } from '@twabRewards/UsersDelegationState'
import { useAtom } from 'jotai'
import {
  delegationChainIdAtom,
  // delegatorAtom,
  setDelegationChainAtom
  // setDelegatorAtom
} from './atoms'
import { useUpdateAtom } from 'jotai/utils'
import { useUsersAddress } from '@pooltogether/wallet-connection'

// TODO: Go to confirmation modal while wallet is on wrong network. Switch networks. Lotsa problems.
export const TwabRewards: React.FC = () => {
  const [chainId] = useAtom(delegationChainIdAtom)
  const setChainId = useUpdateAtom(setDelegationChainAtom)
  const usersAddress = useUsersAddress()
  const [delegator] = useAtom(delegatorAtom)
  const setDelegator = useUpdateAtom(setDelegatorAtom)

  // Lazy way to get the app to react on wallet connection
  useEffect(() => {
    if (!delegator) {
      setDelegator(usersAddress)
    }
  }, [usersAddress])

  return (
    <Layout>
      <PagePadding>
        <PageTitle title='Deposit Delegator' />
        <DelegationTitle className='mb-8' />
        <UsersDelegationState
          chainId={chainId}
          delegator={delegator}
          setDelegator={setDelegator}
          setChainId={setChainId}
          className='mb-8'
        />
        <DelegationList delegator={delegator} chainId={chainId} setDelegator={setDelegator} />
      </PagePadding>
    </Layout>
  )
}