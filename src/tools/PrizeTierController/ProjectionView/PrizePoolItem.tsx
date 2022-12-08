import { Token } from '@pooltogether/hooks'
import { formatUnformattedBigNumberForDisplay } from '@pooltogether/utilities'
import { PrizePool } from '@pooltogether/v4-client-js'
import { calculate } from '@pooltogether/v4-utils-js'
import { allCombinedPrizeTiersAtom } from '@prizeTierController/atoms'
import { DPR_DECIMALS } from '@prizeTierController/config'
import { usePrizePoolTvl } from '@prizeTierController/hooks/usePrizePoolTvl'
import { PrizeTierConfigV2, PrizeTierHistoryContract } from '@prizeTierController/interfaces'
import { PrizeTierHistoryTitle } from '@prizeTierController/PrizeTierHistoryTitle'
import { calculateDprMultiplier } from '@prizeTierController/utils/calculateDprMultiplier'
import { formatPrettyPercentage } from '@prizeTierController/utils/formatPrettyPercentage'
import { formatUnits } from 'ethers/lib/utils'
import { useAtom } from 'jotai'
import { useTranslation } from 'next-i18next'

// TODO: proper styling
// TODO: localization

export const PrizePoolItem = (props: {
  prizePool: PrizePool
  prizeTierHistoryContract?: PrizeTierHistoryContract
}) => {
  const { prizePool, prizeTierHistoryContract } = props
  const [combinedPrizeTiers] = useAtom(allCombinedPrizeTiersAtom)

  if (!!prizeTierHistoryContract && !!combinedPrizeTiers) {
    const prizeTier = combinedPrizeTiers[prizePool.chainId]?.[prizeTierHistoryContract.address]
    if (!!prizeTier) {
      return (
        <li className='p-4 bg-actually-black bg-opacity-10 rounded-xl'>
          <PrizeTierHistoryTitle
            prizeTierHistoryContract={prizeTierHistoryContract}
            showLink
            className='mb-4'
          />
          <PrizePoolProjections
            prizePool={prizePool}
            prizeTierHistoryContract={prizeTierHistoryContract}
            prizeTier={prizeTier}
          />
        </li>
      )
    }
  }
}

const PrizePoolProjections = (props: {
  prizePool: PrizePool
  prizeTierHistoryContract: PrizeTierHistoryContract
  prizeTier: PrizeTierConfigV2
}) => {
  const { prizePool, prizeTierHistoryContract, prizeTier } = props
  const { data: tvl, isFetched: isFetchedTvl } = usePrizePoolTvl(prizePool)
  const { t } = useTranslation()

  // TODO: show dropped prizes estimates
  // TODO: include variance input

  return (
    <>
      {isFetchedTvl ? (
        <>
          <PoolTVL tvl={tvl} token={prizeTierHistoryContract.token} />
          <PoolDPR dpr={prizeTier.dpr} />
          <DrawChances tvl={tvl} prizeTier={prizeTier} token={prizeTierHistoryContract.token} />
        </>
      ) : (
        t('loading')
      )}
    </>
  )
}

const PoolTVL = (props: { tvl: number; token: Token }) => {
  const { tvl, token } = props

  // TODO: make tvl input (with reset button to return to actual value)

  return (
    <div>
      TVL: {tvl.toLocaleString('en', { maximumFractionDigits: 0 })} {token.symbol}
    </div>
  )
}

const PoolDPR = (props: { dpr: number }) => {
  const { dpr } = props

  return <div>With a DPR of {formatPrettyPercentage(dpr)}...</div>
}

const DrawChances = (props: { tvl: number; prizeTier: PrizeTierConfigV2; token: Token }) => {
  const { tvl, prizeTier, token } = props

  const multiplier = calculateDprMultiplier(prizeTier.dpr, tvl, prizeTier.prize, token.decimals)
  const prizes = prizeTier.tiers.map((tier, i) =>
    formatUnformattedBigNumberForDisplay(
      calculate.calculatePrizeForTierPercentage(i, tier, prizeTier.bitRangeSize, prizeTier.prize),
      token.decimals
    )
  )
  const numPrizesPerTier = calculate.calculateNumberOfPrizesPerTier(prizeTier)
  const prizeChances = numPrizesPerTier.map((value) =>
    (value * multiplier).toLocaleString('en', { maximumFractionDigits: 4 })
  )

  return (
    <ul>
      <span className='opacity-80'>Each Draw</span>
      {prizes.map((prize, i) => {
        if (prize === '0') return null

        return (
          <li key={`pl-${i}-${token.address}-${tvl}`}>
            {prizeChances[i]} prizes of {prize}
          </li>
        )
      })}
    </ul>
  )
}

const PrizesDistributedOverTime = (props: { tvl: number; prizeTier: PrizeTierConfigV2 }) => {
  const { tvl, prizeTier } = props

  // TODO: show prizes over time chart
  // TODO: display daily, weekly, monthly, and yearly estimate of prize amounts
  // TODO: add toggle for taking into account dropped prizes or not

  return <></>
}
