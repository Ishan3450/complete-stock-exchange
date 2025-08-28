import { getFormattedValue } from "@/lib/common"
import { UserInterface } from "@repo/shared-types/types"

type PortfolioProps = {
    userPortfolio: UserInterface | null
}

export default function Portfolio({ userPortfolio }: PortfolioProps) {
    return <div>
        {userPortfolio && (
            <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Portfolio</h2>

                {/* Balances */}
                <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">Balances</h3>
                    <ul className="divide-y divide-gray-200">
                        {Object.entries(userPortfolio.balance).map(([currency, amount]) => (
                            <li key={currency} className="flex justify-between py-2">
                                <span className="text-gray-600">{currency}</span>
                                <span className="font-medium">{getFormattedValue(amount)}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Holdings */}
                <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">Holdings</h3>
                    <ul className="divide-y divide-gray-200">
                        {Object.entries(userPortfolio.holdings).map(([asset, qty]) => (
                            <li key={asset} className="flex justify-between py-2">
                                <span className="text-gray-600">{asset}</span>
                                <span className="font-medium">{getFormattedValue(qty)}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Locked Balances */}
                {Object.keys(userPortfolio.lockedBalance).length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-lg font-medium mb-2">Locked Balance</h3>
                        <ul className="divide-y divide-gray-200">
                            {Object.entries(userPortfolio.lockedBalance).map(([currency, amount]) => (
                                <li key={currency} className="flex justify-between py-2">
                                    <span className="text-gray-600">{currency}</span>
                                    <span className="font-medium">{getFormattedValue(amount)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Locked Holdings */}
                {Object.keys(userPortfolio.lockedHolding).length > 0 && (
                    <div>
                        <h3 className="text-lg font-medium mb-2">Locked Holdings</h3>
                        <ul className="divide-y divide-gray-200">
                            {Object.entries(userPortfolio.lockedHolding).map(([asset, qty]) => (
                                <li key={asset} className="flex justify-between py-2">
                                    <span className="text-gray-600">{asset}</span>
                                    <span className="font-medium">{getFormattedValue(qty)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        )}
    </div>
}