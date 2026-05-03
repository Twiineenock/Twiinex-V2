package org.hiero.base;

import com.hedera.hashgraph.sdk.ContractId;
import java.util.function.Consumer;
import org.hiero.base.data.ContractLog;
import org.jspecify.annotations.NonNull;

/**
 * A client for observing smart contract events (logs) in real-time.
 */
public interface ContractEventClient {

    /**
     * Subscribe to logs emitted by a specific contract.
     *
     * @param contractId the contract ID to observe
     * @param callback the callback to invoke for each new log
     * @return a subscription handle that can be used to stop observing
     * @throws HieroException if observation could not be started
     */
    @NonNull Subscription observeContractLogs(
        @NonNull ContractId contractId, 
        @NonNull Consumer<ContractLog> callback
    ) throws HieroException;

    /**
     * A handle for a log subscription.
     */
    interface Subscription extends AutoCloseable {
        @Override
        void close();
    }
}
