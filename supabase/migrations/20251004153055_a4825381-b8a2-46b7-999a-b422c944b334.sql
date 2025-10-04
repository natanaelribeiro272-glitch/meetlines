-- Add policy to allow users to update their own attendance confirmation
CREATE POLICY "Users can update their own attendance confirmation"
ON event_registrations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add policy to allow organizers to delete registrations from their events
CREATE POLICY "Organizers can delete registrations from their events"
ON event_registrations
FOR DELETE
USING (
  event_id IN (
    SELECT e.id
    FROM events e
    JOIN organizers o ON e.organizer_id = o.id
    WHERE o.user_id = auth.uid()
  )
);