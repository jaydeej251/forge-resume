Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      scope path: "auth", controller: "auth", as: "auth" do
        post :signup
        post :login
        post :google
        get :me
        post :claim
      end

      namespace :admin do
        get "stats", to: "stats#show"
        resources :users, only: [ :index ] do
          member do
            get :resumes
          end
        end
      end

      resources :resumes, only: [ :index, :create, :show, :update ], param: :session_id do
        resource :photo, only: [ :create, :destroy ]
        resources :messages, only: [ :create ] do
          collection do
            post :stream
          end
        end
      end
    end
  end
end
