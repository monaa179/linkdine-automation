export const useCurrentAccount = () => {
    const currentAccountId = useCookie<number | null>('current_account_id', {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
    })

    // We'll store the account details here once fetched
    const currentAccount = useState<any | null>('current_account', () => null)

    const setCurrentAccountId = (id: number | null) => {
        currentAccountId.value = id
        if (!id) {
            currentAccount.value = null
        }
    }

    const fetchCurrentAccount = async () => {
        if (!currentAccountId.value) {
            currentAccount.value = null
            return null
        }

        try {
            const account = await $fetch(`/api/accounts/${currentAccountId.value}`)
            currentAccount.value = account
            return account
        } catch (e) {
            console.error('Failed to fetch current account', e)
            currentAccount.value = null
            return null
        }
    }

    return {
        currentAccountId,
        currentAccount,
        setCurrentAccountId,
        fetchCurrentAccount
    }
}
