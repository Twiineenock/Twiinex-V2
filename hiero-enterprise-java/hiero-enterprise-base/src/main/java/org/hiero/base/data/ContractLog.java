package org.hiero.base.data;

import com.hedera.hashgraph.sdk.ContractId;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;

/** Represents a log entry emitted by a smart contract on the Hiero network. */
public record ContractLog(
    @NonNull String address,
    @NonNull String data,
    @NonNull List<String> topics,
    @NonNull Instant timestamp,
    @NonNull String transactionHash,
    int transactionIndex,
    @Nullable ContractId contractId,
    @Nullable String rootAddress,
    @Nullable Integer bloom) {
  public ContractLog {
    Objects.requireNonNull(address, "address must not be null");
    Objects.requireNonNull(data, "data must not be null");
    Objects.requireNonNull(topics, "topics must not be null");
    Objects.requireNonNull(timestamp, "timestamp must not be null");
    Objects.requireNonNull(transactionHash, "transactionHash must not be null");
  }
}
