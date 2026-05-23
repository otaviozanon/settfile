import React from "react";
import { Provider } from "../providers";

interface Props {
  providers: Provider[];
  selectedProviderId: string | null;
  onSelectProvider: (id: string | null) => void;
}

const formatSize = (maxMB: number): string => {
  return maxMB >= 1024 ? `${(maxMB / 1024).toFixed(1)} GB` : `${maxMB} MB`;
};

export const ProvidersTable = React.memo<Props>(
  ({ providers, selectedProviderId, onSelectProvider }) => {
    return (
      <>
        <h2>Available Servers</h2>
        <table className="providers-table">
          <thead>
            <tr>
              <th>Server</th>
              <th>Max Size</th>
              <th>Retention</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => {
              const isSelected = selectedProviderId === provider.id;
              return (
                <tr
                  key={provider.id}
                  className={isSelected ? "selected-row" : ""}
                >
                  <td>{provider.name}</td>
                  <td>{formatSize(provider.maxMB)}</td>
                  <td>{provider.expire}</td>
                  <td>
                    <span
                      style={{
                        color: provider.upload ? "#0a0" : "#999",
                        fontSize: "0.9em",
                      }}
                    >
                      {provider.upload ? "✓ Ready" : "⏸ Coming soon"}
                    </span>
                  </td>
                  <td>
                    {provider.upload && (
                      <button
                        className={`select-host-button ${isSelected ? "active" : ""}`}
                        onClick={() =>
                          onSelectProvider(isSelected ? null : provider.id)
                        }
                        style={{
                          padding: "4px 8px",
                          fontSize: "0.8em",
                          cursor: "pointer",
                          borderRadius: "4px",
                        }}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </>
    );
  },
);
