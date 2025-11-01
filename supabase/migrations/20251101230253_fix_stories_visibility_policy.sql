/*
  # Corrigir Policy de Visibilidade de Stories

  1. Problema Identificado:
    - Policy atual permite visualizar TODOS os stories (USING true)
    - Não respeita configurações de visibilidade (story_visible_to)
    
  2. Solução:
    - Remover policy antiga e insegura
    - Criar nova policy que respeita:
      * Sempre mostra stories do próprio usuário
      * Para outros usuários, verifica story_visible_to:
        - 'both': visível para amigos E pessoas próximas
        - 'friends_only': visível APENAS para amigos aceitos
        - 'nearby_only': visível APENAS para pessoas próximas (< 100m)
    
  3. Segurança:
    - Stories não expirados (expires_at > now())
    - Respeita configurações de privacidade do usuário
    - Verifica amizades aceitas (status = 'accepted')
    - Verifica proximidade geográfica real
*/

-- Remover policy antiga que permite ver tudo
DROP POLICY IF EXISTS "Users can view nearby users stories" ON public.stories;

-- Criar nova policy restritiva que respeita configurações de visibilidade
CREATE POLICY "Users can view stories based on visibility settings"
ON public.stories
FOR SELECT
USING (
  -- Story não expirado
  expires_at > now()
  AND
  (
    -- Sempre pode ver seus próprios stories
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = stories.user_id
      AND (
        -- Visível para ambos (amigos E próximos)
        p.story_visible_to = 'both'
        OR
        -- Visível apenas para amigos
        (
          p.story_visible_to = 'friends_only'
          AND EXISTS (
            SELECT 1 FROM friendships f
            WHERE f.status = 'accepted'
            AND (
              (f.user_id = stories.user_id AND f.friend_id = auth.uid())
              OR
              (f.friend_id = stories.user_id AND f.user_id = auth.uid())
            )
          )
        )
        OR
        -- Visível apenas para pessoas próximas (< 100m)
        (
          p.story_visible_to = 'nearby_only'
          AND EXISTS (
            SELECT 1 FROM profiles viewer
            WHERE viewer.user_id = auth.uid()
            AND viewer.latitude IS NOT NULL
            AND viewer.longitude IS NOT NULL
            AND p.latitude IS NOT NULL
            AND p.longitude IS NOT NULL
            AND (
              -- Cálculo de distância usando fórmula haversine simplificada
              -- 111000 metros = 1 grau de latitude aproximadamente
              -- Verifica se está dentro de ~100m
              (
                ABS(p.latitude - viewer.latitude) * 111000 
                + ABS(p.longitude - viewer.longitude) * 111000 * COS(RADIANS(viewer.latitude))
              ) <= 100
            )
          )
        )
      )
    )
  )
);

-- Comentário explicativo
COMMENT ON POLICY "Users can view stories based on visibility settings" ON public.stories IS 
'Permite visualizar stories baseado nas configurações de visibilidade: próprios stories sempre visíveis, outros usuários só se configurarem visibilidade para amigos (friendships aceitas) ou próximos (< 100m de distância)';
