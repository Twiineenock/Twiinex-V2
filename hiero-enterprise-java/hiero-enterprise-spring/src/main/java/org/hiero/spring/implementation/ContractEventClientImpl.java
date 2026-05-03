package org.hiero.spring.implementation;

import com.hedera.hashgraph.sdk.ContractId;
import java.time.Instant;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;
import org.hiero.base.ContractEventClient;
import org.hiero.base.HieroException;
import org.hiero.base.data.ContractLog;
import org.hiero.base.data.Page;
import org.hiero.base.mirrornode.MirrorNodeClient;
import org.jspecify.annotations.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ContractEventClientImpl implements ContractEventClient {

    private static final Logger logger = LoggerFactory.getLogger(ContractEventClientImpl.class);
    private final MirrorNodeClient mirrorNodeClient;
    private final ScheduledExecutorService executorService;

    public ContractEventClientImpl(MirrorNodeClient mirrorNodeClient) {
        this.mirrorNodeClient = Objects.requireNonNull(mirrorNodeClient, "mirrorNodeClient must not be null");
        this.executorService = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "hiero-contract-event-observer");
            t.setDaemon(true);
            return t;
        });
    }

    @Override
    public @NonNull Subscription observeContractLogs(
            @NonNull ContractId contractId, 
            @NonNull Consumer<ContractLog> callback) throws HieroException {
        
        PollingSubscription subscription = new PollingSubscription(contractId, callback);
        executorService.scheduleWithFixedDelay(subscription, 0, 5, TimeUnit.SECONDS);
        return subscription;
    }

    private class PollingSubscription implements Subscription, Runnable {
        private final ContractId contractId;
        private final Consumer<ContractLog> callback;
        private Instant lastTimestamp = Instant.now();
        private final Set<String> processedTransactions = Collections.synchronizedSet(new HashSet<>());
        private boolean closed = false;

        public PollingSubscription(ContractId contractId, Consumer<ContractLog> callback) {
            this.contractId = contractId;
            this.callback = callback;
        }

        @Override
        public void run() {
            if (closed) return;
            try {
                Page<ContractLog> logsPage = mirrorNodeClient.queryContractLogs(contractId);
                List<ContractLog> logs = logsPage.getData();
                
                // Sort by timestamp to process in order
                logs.stream()
                    .filter(log -> log.timestamp().isAfter(lastTimestamp) || 
                                  (log.timestamp().equals(lastTimestamp) && !processedTransactions.contains(log.transactionHash())))
                    .sorted((l1, l2) -> l1.timestamp().compareTo(l2.timestamp()))
                    .forEach(log -> {
                        callback.accept(log);
                        lastTimestamp = log.timestamp();
                        processedTransactions.add(log.transactionHash());
                    });
                
                // Clean up old transactions from the set to prevent memory leaks
                if (processedTransactions.size() > 1000) {
                    processedTransactions.clear();
                }

            } catch (Exception e) {
                logger.error("Error polling contract logs for {}", contractId, e);
            }
        }

        @Override
        public void close() {
            this.closed = true;
        }
    }
}
