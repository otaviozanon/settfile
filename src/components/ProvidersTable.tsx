import React from "react";
import { Provider } from "../providers";

interface Props {
  providers: Provider[];
}

export const ProvidersTable: React.FC<Props> = ({ providers }) => {
  return (
    <>
      <h2>Servidores disponíveis</h2>
      <table className="providers-table">
        <thead>
          <tr>
            <th>Servidor</th>
            <th>Limite</th>
            <th>Expiração</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((provider) => (
            <tr key={provider.id}>
              <td>{provider.name}</td>
              <td>
                {provider.maxMB >= 1024
                  ? `${(provider.maxMB / 1024).toFixed(1)} GB`
                  : `${provider.maxMB} MB`}
              </td>
              <td>{provider.expire}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};
