'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserMinus, Send, Mail, CheckCircle2, Clock } from 'lucide-react';
import { Collaborator, inviteCollaborator, removeCollaborator } from '@/lib/actions';
import Button from '../atoms/Button';
import InputField from '../molecules/InputField';

interface CollaboratorsModalProps {
  listId: number;
  collaborators: Collaborator[];
  isOwner: boolean;
}

export default function CollaboratorsModal({
  listId,
  collaborators,
  isOwner,
}: CollaboratorsModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const targetEmail = email.trim();
    if (!targetEmail) return;

    startTransition(async () => {
      const res = await inviteCollaborator(listId, targetEmail);
      if (res?.error) {
        setError(res.error);
      } else {
        setEmail('');
        if (res?.isNewUser) {
          setSuccess('Convite enviado! O usuário ainda não tem conta no SmartShop, mas o acesso será liberado assim que ele se cadastrar.');
        } else {
          setSuccess('Convite enviado com sucesso!');
        }
        router.refresh();
      }
    });
  };

  const handleRemove = (collaboratorId: number, emailToRemove: string) => {
    if (!confirm(`Deseja realmente remover ${emailToRemove} desta lista?`)) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await removeCollaborator(listId, collaboratorId);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess('Colaborador removido com sucesso!');
        router.refresh();
      }
    });
  };

  return (
    <div className="collaborators-container">
      {/* Formulário de Convite (Apenas para o Dono) */}
      {isOwner ? (
        <form onSubmit={handleInvite} className="collaborator-invite-form">
          <p className="section-subtitle" style={{ marginBottom: '10px' }}>
            Convide alguém para ver e editar os itens desta lista de compras em tempo real.
          </p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <InputField
                id="collaborator-email"
                label="E-mail"
                type="email"
                placeholder="Ex: ana@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending || !email.trim()}
              style={{ height: '42px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Send size={16} />
            </Button>
          </div>
        </form>
      ) : (
        <p className="section-subtitle" style={{ marginBottom: '15px' }}>
          Você está participando desta lista como colaborador. Apenas o proprietário pode convidar outras pessoas.
        </p>
      )}

      {/* Alertas de Feedback */}
      {error && <div className="error-banner" style={{ marginTop: '10px', marginBottom: '10px' }}>{error}</div>}
      {success && <div className="success-banner" style={{ marginTop: '10px', marginBottom: '10px' }}>{success}</div>}

      {/* Lista de Colaboradores */}
      <div className="collaborators-list-section" style={{ marginTop: '20px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--secondary)', marginBottom: '12px' }}>
          Pessoas com Acesso ({collaborators.length})
        </h4>

        {collaborators.length > 0 ? (
          <div className="collaborators-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {collaborators.map((c) => {
              const displayName = c.profiles?.name || c.invited_email.split('@')[0];
              const isPendingInvite = c.status === 'pending';

              return (
                <div
                  key={c.id}
                  className="collaborator-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: 'var(--surface-variant, #f8f9fa)',
                    border: '1px solid var(--border-color, #eef0f2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--primary-light, #e0f2fe)',
                        color: 'var(--primary, #0284c7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                      }}
                    >
                      {displayName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-color, #1e293b)' }}>
                        {displayName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={10} />
                        <span>{c.invited_email}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isPendingInvite ? (
                      <span
                        title="Aguardando o convidado aceitar"
                        style={{
                          fontSize: '10px',
                          background: '#fef3c7',
                          color: '#d97706',
                          padding: '2px 6px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontWeight: '600',
                        }}
                      >
                        <Clock size={10} />
                        <span>Pendente</span>
                      </span>
                    ) : (
                      <span
                        title="Acesso ativo"
                        style={{
                          fontSize: '10px',
                          background: '#dcfce7',
                          color: '#15803d',
                          padding: '2px 6px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontWeight: '600',
                        }}
                      >
                        <CheckCircle2 size={10} />
                        <span>Ativo</span>
                      </span>
                    )}

                    {/* Botão de Remover Colaborador (Apenas para o dono, e não pode remover a si mesmo se constar) */}
                    {isOwner && (
                      <button
                        onClick={() => handleRemove(Number(c.id), c.invited_email)}
                        disabled={isPending}
                        title="Remover acesso"
                        style={{
                          border: 'none',
                          background: 'none',
                          color: 'var(--danger, #ef4444)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <UserMinus size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>
            Nenhum colaborador adicionado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
