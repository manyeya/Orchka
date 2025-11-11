import React from 'react'

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Application Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Application Name</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="Flowbase"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Default Language</label>
              <select className="w-full mt-1 px-3 py-2 border rounded-md">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Email Notifications</label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Push Notifications</label>
                <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
              </div>
              <input type="checkbox" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
