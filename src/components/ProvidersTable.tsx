import React from "react";
import { Provider } from "../providers";

interface Props {
  providers: Provider[];
}

const formatSize = (maxMB: number): string => {
  return maxMB >= 1024 ? `${(maxMB / 1024).toFixed(1)} GB` : `${maxMB} MB`;
};

export const ProvidersTable = React.memo<Props>(({ providers }) => {
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
          </tr>
        </thead>
        <tbody>
          {providers.map((provider) => (
            <tr key={provider.id}>
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
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
});
