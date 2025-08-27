import { UserInterface } from "@repo/shared-types/types"

type PortfolioProps = {
    userPortfolio: UserInterface | null
}

export default function Portfolio({ userPortfolio }: PortfolioProps) {
    return <div>
        {!userPortfolio && (
            <div>
                Please signin/signup to see the portfolio.
            </div>
        )}

        {userPortfolio && (
            <div>
                {JSON.stringify(userPortfolio)}
            </div>
        )}
    </div>
}