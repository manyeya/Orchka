import React from 'react'

function TeamSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Team Members</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">JD</span>
                </div>
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-sm text-muted-foreground">john@example.com</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Admin</span>
                <button className="text-sm text-muted-foreground hover:text-foreground">Edit</button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">JS</span>
                </div>
                <div>
                  <p className="font-medium">Jane Smith</p>
                  <p className="text-sm text-muted-foreground">jane@example.com</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Member</span>
                <button className="text-sm text-muted-foreground hover:text-foreground">Edit</button>
              </div>
            </div>
          </div>

          <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Invite Team Member
          </button>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Team Permissions</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Allow members to invite others</label>
                <p className="text-sm text-muted-foreground">Team members can send invitations</p>
              </div>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Require admin approval for new members</label>
                <p className="text-sm text-muted-foreground">New members need admin approval to join</p>
              </div>
              <input type="checkbox" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamSettingsPage
