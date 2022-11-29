import { usePrizePools } from '@hooks/usePrizePools'
import { usePrizePoolTokens } from '@pooltogether/hooks'
import { Button, ButtonSize, ButtonTheme } from '@pooltogether/react-components'
import { formatUnformattedBigNumberForDisplay } from '@pooltogether/utilities'
import { calculate, PrizePool, PrizeTierConfig } from '@pooltogether/v4-client-js'
import { isPrizeTierListCollapsed } from '@prizeTierController/atoms'
import { usePrizeTierHistoryData } from '@prizeTierController/hooks/usePrizeTierHistoryData'
import { PrizePoolTitle } from '@prizeTierController/PrizePoolTitle'
import { formatCombinedPrizeTier } from '@prizeTierController/utils/formatCombinedPrizeTier'
import classNames from 'classnames'
import { BigNumber } from 'ethers'
import { useAtom } from 'jotai'
import { useUpdateAtom } from 'jotai/utils'
import { useEffect } from 'react'
import {
  isEditPrizeTiersModalOpenAtom,
  prizeTierEditsAtom,
  allCombinedPrizeTiersAtom,
  selectedPrizePoolIdAtom,
  selectedPrizeTierHistoryAddressAtom,
  selectedPrizeTierHistoryChainIdAtom
} from './atoms'

export const PrizeTierHistoryList = (props: { className?: string }) => {
  const { className } = props
  const prizePools = usePrizePools()

  return (
    <ul className={classNames('grid grid-cols-1 sm:grid-cols-2 gap-4', className)}>
      {prizePools.map((prizePool) => (
        <PrizePoolItem prizePool={prizePool} key={'pth-item-' + prizePool.id()} />
      ))}
    </ul>
  )
}

const PrizePoolItem = (props: { prizePool: PrizePool }) => {
  const { prizePool } = props

  const { data: upcomingPrizeTier, isFetched } = usePrizeTierHistoryData(prizePool)

  return (
    <li className='p-4 bg-actually-black bg-opacity-10 rounded-xl'>
      <PrizePoolTitle prizePool={prizePool} showLink className='mb-4' />
      {isFetched ? (
        <PrizeTierState prizePool={prizePool} prizeTier={upcomingPrizeTier} />
      ) : (
        'Loading...'
      )}
    </li>
  )
}

/**
 *
 * @param props
 */
const PrizeTierState = (props: { prizePool: PrizePool; prizeTier: PrizeTierConfig }) => {
  const { prizePool, prizeTier } = props
  const [allPrizeTierEdits] = useAtom(prizeTierEditsAtom)
  const [combinedPrizeTiers, setCombinedPrizeTiers] = useAtom(allCombinedPrizeTiersAtom)
  const prizeTierEdits =
    allPrizeTierEdits[prizePool.chainId]?.[prizePool.prizeTierHistoryMetadata.address]
  const { data: tokens } = usePrizePoolTokens(prizePool)

  // Calculating combined outcome of existing and edited prize tiers:
  const combinedPrizeTier = formatCombinedPrizeTier(prizeTier, prizeTierEdits)
  useEffect(() => {
    setCombinedPrizeTiers(() => {
      const updatedCombinedPrizeTiers = { ...combinedPrizeTiers }
      if (!updatedCombinedPrizeTiers[prizePool.chainId]) {
        updatedCombinedPrizeTiers[prizePool.chainId] = {}
      }
      updatedCombinedPrizeTiers[prizePool.chainId][prizePool.prizeTierHistoryMetadata.address] =
        combinedPrizeTier
      return updatedCombinedPrizeTiers
    })
  }, [prizeTier, prizeTierEdits])

  const defaultNumberofPrizesPerTier = calculate.calculateNumberOfPrizesPerTier(prizeTier)
  const defaultTotalPrizes = defaultNumberofPrizesPerTier.reduce((a, b) => a + b, 0)

  const numberOfPrizesPerTier = calculate.calculateNumberOfPrizesPerTier(combinedPrizeTier)
  const valueOfPrizesPerTier = combinedPrizeTier.tiers.map((tier, index) =>
    calculate.calculatePrizeForTierPercentage(
      index,
      tier,
      combinedPrizeTier.bitRangeSize,
      combinedPrizeTier.prize
    )
  )
  const totalPrizes = numberOfPrizesPerTier.reduce((a, b) => a + b, 0)

  const setIsOpen = useUpdateAtom(isEditPrizeTiersModalOpenAtom)
  const setSelectedPrizePoolId = useUpdateAtom(selectedPrizePoolIdAtom)
  const setSelectedPrizeTierHistoryAddress = useUpdateAtom(selectedPrizeTierHistoryAddressAtom)
  const setSelectedPrizeTierHistoryChainId = useUpdateAtom(selectedPrizeTierHistoryChainIdAtom)

  const [isCollapsed] = useAtom(isPrizeTierListCollapsed)

  return (
    <div>
      <div className={classNames('grid grid-cols-2 gap-x-2 gap-y-3', { 'mb-4': !isCollapsed })}>
        <Stat label='Total Prizes' value={totalPrizes} defaultValue={defaultTotalPrizes} />
        <Stat
          label='Total Value'
          value={formatUnformattedBigNumberForDisplay(
            combinedPrizeTier.prize,
            tokens?.token.decimals
          )}
          defaultValue={formatUnformattedBigNumberForDisplay(
            prizeTier.prize,
            tokens?.token.decimals
          )}
        />
        {!isCollapsed && (
          <PrizeTierStats
            prizeTier={combinedPrizeTier}
            defaultMaxPicksValue={prizeTier.maxPicksPerUser}
            defaultBitRangeValue={prizeTier.bitRangeSize}
          />
        )}
      </div>

      {!isCollapsed && (
        <PrizesList
          prizePool={prizePool}
          prizeTier={combinedPrizeTier}
          numberOfPrizesPerTier={numberOfPrizesPerTier}
          valueOfPrizesPerTier={valueOfPrizesPerTier}
        />
      )}

      <div className={classNames('w-full flex justify-end', { 'mt-4': !isCollapsed })}>
        <Button
          onClick={() => {
            setSelectedPrizePoolId(prizePool.id())
            setSelectedPrizeTierHistoryAddress(prizePool.prizeTierHistoryMetadata.address)
            setSelectedPrizeTierHistoryChainId(prizePool.chainId)
            setIsOpen(true)
          }}
          theme={ButtonTheme.transparent}
          size={ButtonSize.sm}
        >
          Edit
        </Button>
      </div>
    </div>
  )
}

const PrizeTierStats = (props: {
  prizeTier: PrizeTierConfig
  defaultMaxPicksValue: number
  defaultBitRangeValue: number
}) => {
  const { prizeTier, defaultMaxPicksValue, defaultBitRangeValue } = props

  return (
    <>
      <Stat
        label='Max Picks Per User'
        value={prizeTier.maxPicksPerUser}
        defaultValue={defaultMaxPicksValue}
      />
      <Stat
        label='Bit Range Size'
        value={prizeTier.bitRangeSize}
        defaultValue={defaultBitRangeValue}
      />
    </>
  )
}

const Stat = (props: { label: string; value: number | string; defaultValue?: number | string }) => (
  <div className='flex flex-col leading-none'>
    <div className='text-xs opacity-80 mb-1'>{props.label}</div>
    <div className='flex gap-2 font-bold text-sm'>
      {props.defaultValue !== undefined && props.value !== props.defaultValue && (
        <span className='line-through opacity-40'>{props.defaultValue}</span>
      )}
      <span
        className={classNames({
          'text-pt-green':
            !!props.defaultValue &&
            (typeof props.value === 'string' && typeof props.defaultValue === 'string'
              ? parseFloat(props.value.replaceAll(',', '')) >
                parseFloat(props.defaultValue.replaceAll(',', ''))
              : props.value > props.defaultValue),
          'text-pt-red':
            !!props.defaultValue &&
            (typeof props.value === 'string' && typeof props.defaultValue === 'string'
              ? parseFloat(props.value.replaceAll(',', '')) <
                parseFloat(props.defaultValue.replaceAll(',', ''))
              : props.value < props.defaultValue)
        })}
      >
        {props.value}
      </span>
    </div>
  </div>
)

const PrizesList = (props: {
  prizePool: PrizePool
  prizeTier: PrizeTierConfig
  numberOfPrizesPerTier: number[]
  valueOfPrizesPerTier: BigNumber[]
}) => {
  const { prizePool, prizeTier, numberOfPrizesPerTier, valueOfPrizesPerTier } = props
  const { data: tokens } = usePrizePoolTokens(prizePool)
  return (
    <ul>
      <li className='grid grid-cols-3 gap-x-4 opacity-80'>
        <div>Tier</div>
        <div>Prizes</div>
        <div>Value</div>
      </li>
      {prizeTier.tiers
        .map((tier, index) => {
          if (tier === 0) return null

          return (
            <li
              key={`pl-${index}-${prizePool.id()}`}
              className='grid grid-cols-3 gap-x-4 font-bold'
            >
              <div>{index + 1}</div>
              <div>{numberOfPrizesPerTier[index]}</div>
              <div>
                {formatUnformattedBigNumberForDisplay(
                  valueOfPrizesPerTier[index],
                  tokens?.token.decimals
                )}
              </div>
            </li>
          )
        })
        .filter(Boolean)}
    </ul>
  )
}